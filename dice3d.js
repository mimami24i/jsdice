/**
 * @fileoverview ダイスを振る(3次元版)。
 *  pre3d(http://deanm.github.com/pre3d/)を前提とする。
 * @author mimami24im@gmail.com
 */
 
/**
 * @namespace
 */
var midice3d = {};

/* 定数 */
midice3d.con = {
  ttype: { // transformのタイプ
    t: 'translate',  // 移動
    r: 'rotate',  // 回転
    s: 'scale'  //拡大
  },
  rad1: Math.PI / 180 // 1°が何ラジアンか
};

/** @typedef {{x: number, y: number, z: number}} */
midice3d.Vector;
/**
 * QuadFaceをコピー
 * @param {Pre3d.QuadFace} qf コピー元QuadFace
 * @return {Pre3d.QuadFace} コピー結果
 * @private
 */
midice3d.copyQF_ = function(qf) {
  var chkArr = [qf.i0, qf.i1, qf.i2, qf.i3];
  var copiedArr = [];
  // i0,i1,i2,i3は、Shape.quads[]の場合はnumber、
  // Renderer.buffered_quads_[].qfの場合はmidice3d.Vector
  for (var i = 0; i < chkArr.length; i++) {
    if (typeof chkArr[i] == 'object' && chkArr[i] !== null) {
      copiedArr[i] = midice3d.copyVec_(chkArr[i]);
    } else {
      copiedArr[i] = chkArr[i];
    }
  }
  var cqf = new Pre3d.QuadFace(copiedArr[0], copiedArr[1], copiedArr[2],
      copiedArr[3]);
  cqf.centroid = (qf.centroid === null) ? null :
      midice3d.copyVec_(qf.centroid);
  cqf.normal1 = (qf.normal1 === null) ? null : midice3d.copyVec_(qf.normal1);
  cqf.normal2 = (qf.normal2 === null) ? null : midice3d.copyVec_(qf.normal2);
  return cqf;
};
/**
 * Pathをコピー
 * @param {Pre3d.Path} pt コピー元path
 * @return {Pre3d.Path} コピー結果
 * @private
 */
midice3d.copyPath_ = function(pt) {
  var cpt = new Pre3d.Path();
  for (var i = 0; i < pt.points.length; i++) {
    cpt.points[i] = midice3d.copyVec_(pt.points[i]);
  }
  for (var i = 0; i < pt.curves.length; i++) {
    cpt.curves[i] = new Pre3d.Curve(pt.curves[i].ep, pt.curves[i].c0,
        pt.curves[i].c1);
  }
  cpt.starting_point = pt.starting_point;
  return cpt;
};
/**
 * Vectorをコピー
 * @param {midice3d.Vector} vec コピー元Vector
 * @return {midice3d.Vector} コピー結果
 * @private
 */
midice3d.copyVec_ = function(vec) {
  return {x: vec.x, y: vec.y, z: vec.z};
};
/**
 * Pathの値に対してtransformを実行。rotateはrotateZ→rotateY→rotateXの順に回転
 * @param {Pre3d.Path} path 対象path
 * @param {string} type transformのタイプ。midice3d.con.ttype の値を設定
 * @param {midice3d.Vector} tp 各方向のtransformサイズ。
 *    回転角は度で指定
 * @private
 */
midice3d.transPath_ = function(path, type, tp) {
  var t = new Pre3d.Transform();
  switch (type) {
    case midice3d.con.ttype.t: {
      t.translate(tp.x, tp.y, tp.z);
      break;
    }
    case midice3d.con.ttype.r: {
      t.rotateZ(midice3d.con.rad1 * tp.z);
      t.rotateY(midice3d.con.rad1 * tp.y);
      t.rotateX(midice3d.con.rad1 * tp.x);
      break;
    }
    case midice3d.con.ttype.s: {
      t.scale(tp.x, tp.y, tp.z);
      break;
    }
    default: {
      return;
    }
  }
  if (path.starting_point === null) {
    var plen = path.points.length;
    path.points[plen] = {x: 0, y: 0, z: 0};
    path.starting_point = plen;
  }
  for (var i = 0; i < path.points.length; i++) {
    path.points[i] = t.transformPoint(path.points[i]);
  }
};

/**
 * ダイスクラス。
 * 特記していない場合、長さの単位は canvas.height / 2 を1とする値。
 * @param {HTMLElement} canvas 表示対象HTMLCanvasElement
 * @param {number} width 1辺の長さ
 * @constructor
 */
midice3d.Dice = function(canvas, width) {
  /**
   * 1辺の長さ
   * @type {number} 
   * @private
   */
  this.width_ = width;
  /**
   * 1辺の長さの半分
   * @type {number}
   * @private
   */
  this.hfwdth_ = this.width_ / 2;
  /**
   * 表示対象HTMLCanvasElement
   * @type {HTMLElement} 
   * @private
   */
  this.canvas_ = canvas;
  /**
   * canvas.heightの半分(px)
   * @type {number}
   * @private
   */
  this.hfcvh_ = canvas.height / 2;
  /**
   * 1以外の目の色。CSSカラーを含んだ文字列を設定。
   * @type {string}
   * @private
   */
  this.eyecol_ = '#000000';
  /**
   * 1の目の色。CSSカラーを含んだ文字列を設定。
   * @type {string}
   * @private
   */
  this.eye1col_ = '#ff0000';
  /**
   * カメラから見た物体の初期値からの回転量の配列。
   * バッファの数だけ要素を作成
   * 初期値では、カメラはz軸方向で上から見下ろしている。
   * 各軸を中心とした回転角を度で指定。rotateZ→rotateY→rotateXの順に回転
   * @type {Array.<midice3d.Vector>} 
   * @private
   */
   this.camAngles_ = [
      {x: 47, y: 40, z: 0},
      {x: -40, y: 55, z: 0},
      {x: 47, y: 35, z: -20}
   ];
  /**
   * カメラから見た物体の初期値からの移動量。
   * 初期値では、カメラは{x:0, y:0, z:-1}でz軸方向真下を見下ろしている。
   * 各軸方向に動かす長さを指定。
   * @type {midice3d.Vector} 
   * @private
   */
   this.camTrans_ = {x: 0, y: 0, z: -2};
  /**
   * カメラのfocal_length
   * @type {number} 
   */
   this.camFocLen = 1;
  /**
   * 明るさのコントラスト。0以上1以下の値を設定。
   * 値が小さいほどコントラストが大きい。
   * @type {number} 
   * @private
   */
   this.lightCont_ = 0.9;
  /**
   * 光源の初期値からの回転量。初期値はz軸方向の単位ベクトル。
   * 各軸を中心とした回転角を度で指定。rotateX→rotateY→rotateZの順に回転
   * @type {midice3d.Vector} 
   * @private
   */
   this.lightAngle_ = {x: -30, y: 0, z: 20};
  /**
   * 光源方向ベクトル。this.init()で生成。
   * @type {midice3d.Vector} 
   * @private
   */
   this.lightVec_ = {x: 0, y: 0, z: 1};
  /**
   * ダイス表示バッファの配列。サイズはthis.camAngles_.length以下であること。
   * @type {Array.<midice3d.DBuffer_>} 
   * @private
   */
   this.dbuf_ = [];
  /**
   * Rendererオブジェクト。this.init()で生成。
   * @type {Pre3d.Renderer}
   * @private
   */
   this.renderer_ = null;
};
/**
 * 初期処理。事前にダイス表示バッファを作成しておく。
 */
midice3d.Dice.prototype.init = function() {
  // Rendererオブジェクト生成
  var renderer = new Pre3d.Renderer(this.canvas_);
  renderer.camera.focal_length = this.camFocLen;
  renderer.fill_rgba = new Pre3d.RGBA(1, 1, 1, 1);  // white

  // 光源方向ベクトル作成
  var g_z_axis_vector = {x: 0, y: 0, z: 1}; // z軸方向単位ベクトル
  var gzt = new Pre3d.Transform();
  gzt.reset();
  gzt.rotateX(midice3d.con.rad1 * this.lightAngle_.x);
  gzt.rotateY(midice3d.con.rad1 * this.lightAngle_.y);
  gzt.rotateZ(midice3d.con.rad1 * this.lightAngle_.z);
  this.lightVec_ =  gzt.transformPoint(g_z_axis_vector);

  // 基本形(回転前のダイス)を作成する。以下、配列のindexは(目の値 - 1)
  // z = 0 の面から基本形の面に移動させるための回転角
  var brot = [{x: -90, y: 0, z: 0}, {x: 0, y: -90, z: 0}, {x: 0, y: 0, z: 0},
      {x: 180, y: 0, z: 0}, {x: 0, y: 90, z: 0}, {x: 90, y: 0, z: 0}];
  // 基本形の各面の重心
  var hfwdth = this.hfwdth_;
  var cent = [{x: 0, y: hfwdth, z: 0}, {x: -hfwdth, y: 0, z: 0},
      {x: 0, y: 0, z: hfwdth}, {x: 0, y: 0, z: -hfwdth},
      {x: hfwdth, y: 0, z: 0}, {x: 0, y: -hfwdth, z: 0}];
  // 1から6の目の基本形のpath
  var eyepathBase = []; 
  var dice = new midice3d.DFace_(this.width_);
  for (var i = 0; i < 6; i++) {
    eyepathBase[i] = dice.makep(i + 1);
    for (var j = 0; j < eyepathBase[i].length; j++) {
      midice3d.transPath_(eyepathBase[i][j], midice3d.con.ttype.r, brot[i]);
    }
  }
  // 目の値を上にするために必要な回転角
  var eyerot = [{x: 0, y: 0, z: 0}, {x: 0, y: 0, z: -90}, {x: -90, y: 0, z: 0},
      {x: 90, y: 0, z: 0}, {x: 0, y: 0, z: 90}, {x: 180, y: 0, z: 0}];

  // ダイス表示バッファ作成
  var cube, eyepath, pathidx, eyevals;
  for (var i = 0; i < this.camAngles_.length; i++) {
    renderer.emptyBuffer();
    var dicebuf = new midice3d.DBuffer_();
    // ダイスの回転角に応じたカメラ設定
    this.set_camera_(renderer, this.camTrans_, this.camAngles_[i]);

    // 立方体のバッファ作成
    cube = Pre3d.ShapeUtils.makeCube(this.width_ / 2);
    renderer.bufferShape(cube);
    this.chgIntensity_(renderer);
    dicebuf.drbuf = this.makeBuf_(renderer);

    // 上の目が1から6のpathのバッファ作成
    for (var j = 0; j < 6; j++) {
      // 表示する目の値を求める
      eyevals = this.getDispEye_(cent, this.camAngles_[i], eyerot[j]);

      dicebuf.eyePathArr[j] = [];
      dicebuf.eye1idxArr[j] = [];
      pathidx = 0;  // dicebuf.eyePathArr[j][] のindex
      // 表示する目のバッファ作成
      for (var j2 = 0; j2 < eyevals.length; j2++) {
        var eyeval = eyevals[j2];
        var pathlen = eyepathBase[eyeval].length;
        if (pathlen == 1) {
          // 1の目のindex格納
          dicebuf.eye1idxArr[j].push(pathidx);
        }
        for (var j3 = 0; j3 < pathlen; j3++) {
          eyepath = midice3d.copyPath_(eyepathBase[eyeval][j3]);
          midice3d.transPath_(eyepath, midice3d.con.ttype.r, eyerot[j]);
          dicebuf.eyePathArr[j][pathidx] =
              this.makePBuf_(eyepath, renderer);
          pathidx++;
        }
      }
    }
    this.dbuf_[i] = dicebuf;
  }

  // Rendererオブジェクトをプロパティに設定
  renderer.emptyBuffer();
  this.renderer_ = renderer;
};
/**
 * 表示する目の値を求める
 * @param {Array.<midice3d.Vector>} centroids 面の重心
 * @param {midice3d.Vector} camrot カメラ回転角
 * @param {midice3d.Vector} eyerot 目の値を上にするための回転角
 * @return {Array.<number>} 表示する目の値 - 1
 * @private
 */
midice3d.Dice.prototype.getDispEye_ = function(centroids, camrot, eyerot) {
  var eyeval = [];
  // 変換行列作成
  var trans = new Pre3d.Transform;
  trans.rotateZ(midice3d.con.rad1 * eyerot.z);
  trans.rotateY(midice3d.con.rad1 * eyerot.y);
  trans.rotateX(midice3d.con.rad1 * eyerot.x);
  trans.rotateZ(midice3d.con.rad1 * camrot.z);
  trans.rotateY(midice3d.con.rad1 * camrot.y);
  trans.rotateX(midice3d.con.rad1 * camrot.x);

  // 重心に変換行列を適用し、z > 0 の重心を抽出
  var tp;
  for (var i = 0; i < centroids.length; i++) {
    tp = trans.transformPoint(centroids[i]);
    // 浮動小数点の誤差を考慮
    if ( tp.z > 0.0000001 ) {
      eyeval.push(i);
    }
  }
  return eyeval;
};

/**
 * renderer.buffered_quads_からdraw用バッファ作成
 * @param {Pre3d.Renderer} renderer 作成元
 * @return {Array.<{qf: Pre3d.QuadFace, fillcolor: string}>}
 * @private
 */
midice3d.Dice.prototype.makeBuf_ = function(renderer) {
  var drbuf = [];
  var all_quads = renderer.buffered_quads_;
  all_quads.sort(midice3d.zSorter_);
  var obj, qf, frgba, iy, rgba, pushedp, iarr, nextj;
  for (var i = 0; i < all_quads.length; i++) {
    obj = all_quads[i];
    
    // qf作成
    qf = obj.qf;
    renderer.projectQuadFaceToCanvasIP(qf);
    for (var j = 0; j < 4; j++) {
      if (j == 3) {
        nextj = 0;
      } else {
        nextj = j + 1;
      }
      pushedp = midice3d.pushPoints2d_(qf['i' + j], qf['i' + nextj]);
      qf['i' + j] = pushedp[0];
      qf['i' + nextj] = pushedp[1];
    }
    // 座標を全て整数化する
    for (var j = 0; j < 4; j++) {
      qf['i' + j].x = ~~qf['i' + j].x;
      qf['i' + j].y = ~~qf['i' + j].y;
    }
    drbuf[i] = {};
    drbuf[i].qf = midice3d.copyQF_(qf);
    
    // fillcolor作成
    frgba = obj.fill_rgba;
    iy = obj.intensity;
    rgba = [~~(frgba.r * iy * 255), ~~(frgba.g * iy * 255),
        ~~(frgba.b * iy * 255), frgba.a];
    drbuf[i].fillcolor = 'rgba(' + rgba.join(',') + ')';
  }
  return drbuf;
};
/**
 * Pre3d.Renderer.buffered_quads_のZ座標順ソート関数。
 * pre3d.js の zSorter()。
 * @param {Object} x 比較対象
 * @param {Object} y 比較対象
 * @return {number} x > y なら正, x == y なら0, それ以外は負
 * @private
 */
midice3d.zSorter_ = function(x, y) {
  return x.qf.centroid.z - y.qf.centroid.z;
};
/**
 * 2点間の距離をすこし離す。
 * pre3d.js の pushPoints2dIP()。
 * @param {{x: number, y: number}} a 対象座標
 * @param {{x: number, y: number}} b 対象座標
 * @return {Array.<{x: number, y: number}>} 変換後の座標。[0]がa、[1]がb
 * @private
 */
midice3d.pushPoints2d_ = function(a, b) {
  var vec = Pre3d.Math.unitVector2d(Pre3d.Math.subPoints2d(b, a));
  if (isNaN(vec.x) || isNaN(vec.y)) {
    vec = {x: 0, y: 0};
  }
  var bpushed = Pre3d.Math.addPoints2d(b, vec);
  var apushed = Pre3d.Math.subPoints2d(a, vec);
  return [apushed, bpushed];
};

/**
 * Pathのdraw用バッファ作成
 * @param {Pre3d.Path} path 作成対象
 * @param {Pre3d.Renderer} renderer 作成環境
 * @return {Pre3d.Path} transformしてprojectPointToCanvasした座標を持つPath
 * @private
 */
midice3d.Dice.prototype.makePBuf_ = function(path, renderer) {
  var trans = new Pre3d.Transform();
  trans.multTransform(renderer.camera.transform);
  trans.multTransform(renderer.transform);
  var tps = [];
  for (var i = 0; i < path.points.length; i++) {
    tps[i] = trans.transformPoint(path.points[i]);
  }
  
  var screen_points = renderer.projectPointsToCanvas(tps);
  var pathbuf = midice3d.copyPath_(path);
  pathbuf.points = screen_points;
  if (path.starting_point === null) {
    var start_point = renderer.projectPointToCanvas(
        trans.transformPoint({x: 0, y: 0, z: 0}));
    var spidx = pathbuf.points.length;
    pathbuf.points[spidx] = start_point;
    pathbuf.starting_point = spidx;
  } else {
    pathbuf.starting_point = path.starting_point;
  }

  // 座標を整数化
  for (var i = 0; i < pathbuf.points.length; i++) {
    pathbuf.points[i].x = ~~pathbuf.points[i].x;
    pathbuf.points[i].y = ~~pathbuf.points[i].y;
    pathbuf.points[i].z = ~~pathbuf.points[i].z;
  }
  return pathbuf;
};

/**
 * cameraをセット。rotateZ→rotateY→rotateX→translateの順に移動
 * @param {Pre3d.Renderer} renderer セット対象Renderer
 * @param {midice3d.Vector} trans
 *  カメラから見て物体を各軸方向に動かす長さ
 * @param {midice3d.Vector} rot
 *  カメラから見て物体を各軸を中心に回転する値。単位はラジアン
 * @private
 */
midice3d.Dice.prototype.set_camera_ = function(renderer, trans, rot) {
  var ct = renderer.camera.transform;
  ct.reset();
  ct.rotateZ(midice3d.con.rad1 * rot.z);
  ct.rotateY(midice3d.con.rad1 * rot.y);
  ct.rotateX(midice3d.con.rad1 * rot.x);
  ct.translate(trans.x, trans.y, trans.z);
};
/**
 * 明るさを変更
 * @param {Pre3d.Renderer} renderer 変更対象Renderer
 * @private
 */
midice3d.Dice.prototype.chgIntensity_ = function(renderer) {
  var intensity; // 面の明るさ
  var n1; // 面の法線ベクトル。明るさ算出に使用
  for (var i = 0; i < renderer.buffered_quads_.length; i++) {
    n1 = renderer.buffered_quads_[i].qf.normal1;
    intensity = Pre3d.Math.dotProduct3d(this.lightVec_, n1);
    intensity += (1 - intensity) * this.lightCont_; 
    // 明るさを変更
    renderer.buffered_quads_[i].intensity = intensity; 
  }
};
/**
 * ダイスを表示する
 * @param {number} bufidx 表示するバッファのindex
 * @param {number} upeyeval 上の目の値
 * @param {number} x 中心のX座標(左上を(0,0)とする。Canvas右方向が正)
 * @param {number} y 中心のY座標(左上を(0,0)とする。Canvas下方向が正)
 * @param {boolean} clrflg 描画前にCanvasをクリアするならtrue。それ以外はfalse
 */
midice3d.Dice.prototype.draw = function(bufidx, upeyeval, x, y, clrflg) {
  // デフォルト値設定
  if (!x) {
    x = 1;
  }
  if (!y) {
    y = 1;
  }
  if (clrflg === undefined) {
    clrflg = true;
  }
  var tx, ty; // 中心移動距離
  tx = ~~(x * this.hfcvh_ - this.canvas_.width / 2);
  ty = ~~(y * this.hfcvh_ - this.hfcvh_);

  var renderer = this.renderer_;
  var dicebuf = this.dbuf_[bufidx];

  if (clrflg) {
    renderer.clearBackground();
  }
  var ctx = renderer.ctx;
  // 立方体を描く
  ctx.save();
  ctx.translate(tx, ty);
  var qf;
  for (var i = 0; i < dicebuf.drbuf.length; i++) {
    qf = dicebuf.drbuf[i].qf;
    ctx.beginPath();
    ctx.moveTo(qf.i0.x, qf.i0.y);
    ctx.lineTo(qf.i1.x, qf.i1.y);
    ctx.lineTo(qf.i2.x, qf.i2.y);
    ctx.lineTo(qf.i3.x, qf.i3.y);
    ctx.fillStyle = dicebuf.drbuf[i].fillcolor;
    ctx.fill();
  }

  // 目を描く
  var eyePath, key, startpt;
  // 1の目のindexを1つの文字列にまとめる
  var eye1idxstr = '#' + dicebuf.eye1idxArr[upeyeval - 1].join('#') + '#';
  for (var i = 0, il = dicebuf.eyePathArr[upeyeval - 1].length; i < il; i++) {
    eyePath = dicebuf.eyePathArr[upeyeval - 1][i];
    // pathが1の目か判定
    key = '#' + i + '#';
    if (eye1idxstr.indexOf(key) >= 0) {
      ctx.fillStyle = this.eye1col_;
    } else {
      ctx.fillStyle = this.eyecol_;
    }
    // pathを描く
    ctx.beginPath();
    startpt = eyePath.starting_point;
    ctx.moveTo(eyePath.points[startpt].x, eyePath.points[startpt].y);
    var curves = eyePath.curves;
    for (var j = 0; j < curves.length; j++) {
      var curve = curves[j];
      if (curve.isQuadratic() === true) {
        var c0 = eyePath.points[curve.c0];
        var ep = eyePath.points[curve.ep];
        ctx.quadraticCurveTo(c0.x, c0.y, ep.x, ep.y);
      } else {
        var c0 = eyePath.points[curve.c0];
        var c1 = eyePath.points[curve.c1];
        var ep = eyePath.points[curve.ep];
        ctx.bezierCurveTo(c0.x, c0.y, c1.x, c1.y, ep.x, ep.y);
      }
    }
    ctx.fill();
  }
  ctx.restore();
};

/**
 * ダイス表示バッファクラス。
 * @private
 * @constructor
 */
midice3d.DBuffer_ = function() {
  /**
   * buffered_quads_[]のqfをprojectQuadFaceToCanvasIP()した結果と、
   * ctx.fillStyleに設定する値。
   * @type {Array.<{qf: Pre3d.QuadFace, fillcolor: string}>}
   */
  this.drbuf = [];
  /**
   * 表示する目のpath配列。indexは上の目の値-1。
   * @type {Array.<Array.<Pre3d.Path>>}
   */
  this.eyePathArr = [];
  /**
   * eyePathArrにおける1の目のindex
   * @type {Array.<Array.<number>>}
   */
  this.eye1idxArr = [];
};


/**
 * ダイス面クラス。
 * 特記していない場合、長さの単位はcanvas.height / 2 を1とする値。
 * @param {number} width 辺の長さ
 * @private
 * @constructor
 */
midice3d.DFace_ = function(width) {
  /**
   * 1辺の長さ
   * @type {number}
   * @private
   */
  this.width_ = width;
  /**
   * 1辺の長さの半分
   * @type {number}
   * @private
   */
  this.hfwdth_ = this.width_ / 2;
  /**
   * 1以外の目の丸の半径は、辺の長さの何倍か
   * @type {number}
   * @private
   */
  this.eyeRadRate_ = 0.1;
   /**
   * 1の目の丸の半径は、1以外の目の丸の半径の何倍か
   * @type {number}
   * @private
   */
  this.eye1RadRate_ = 1.5;
  /**
   * 4の目の丸の中心が、1辺の4分の1から外側にずれる部分の割合。
   * 0以上1以下の値をセット。
   * @type {number}
   * @private
   */
  this.cdist_ = 0.1;
  /**
   * 1の目の中心から、4の目の丸の中心までのx座標上の距離
   * @type {number}
   * @private
   */
  this.distCir_ = this.width_ / 4 * (1 + this.cdist_);
  /**
   * 1以外の目の丸の半径
   * @type {number}
   * @private
   */
  this.eyeRad_ = this.width_ * this.eyeRadRate_;
  /**
   * 1の目の丸の半径
   * @type {number}
   * @private
   */
  this.eye1Rad_ = this.eyeRad_ * this.eye1RadRate_;
  /**
   * 目の中心の座標配列。
   * 配列のindexは、1:右上 2:右中 3:右下 4:中央 5:左上 6:左中 7:左下。
   * 2階層目の配列要素は[x座標,y座標]。サイコロの中心を(0,0)とする
   * @type {Array.<?Array.<number>>}
   * @private
   */
  this.cxyArr_ = [null, [this.distCir_, this.distCir_],
      [this.distCir_, 0], [this.distCir_, -this.distCir_], [0, 0],
      [-this.distCir_, this.distCir_], [-this.distCir_, 0],
      [-this.distCir_, -this.distCir_]];
};
/**
 * 目のpathをz=0の面に作成
 * @param {number} value 目の値。1以上6以下の整数
 * @return {Array.<Pre3d.Path>} 作成したpath
 */
midice3d.DFace_.prototype.makep = function(value) {
  // それぞれの目における、this.makeEyeP_の引数配列
  var eyeposArr = [null, null, [5, 3], [1, 4, 7], [1, 3, 5, 7],
      [1, 3, 4, 5, 7], [1, 2, 3, 5, 6, 7]];
  var paths = [];
  switch (value) {
    case 1: {
      var cp = Pre3d.PathUtils.makeCircle();
      midice3d.transPath_(cp, midice3d.con.ttype.t,
        {x: -this.hfwdth_, y: 0, z: this.hfwdth_});
      var eye1R = this.eye1Rad_ / 0.5;  // makeCircle()の半径が0.5
      midice3d.transPath_(cp, midice3d.con.ttype.s,
          {x: eye1R, y: eye1R, z: 1});
      paths[0] = cp;
      break;
    }
    case 2:
    case 3:
    case 4:
    case 5:
    case 6: {
      for (var i = 0; i < eyeposArr[value].length; i++) {
        paths[i] = this.makeEyeP_(eyeposArr[value][i]);
      }
      break;
    }
    default: {
      break;
    }
  }
  return paths;
};
/**
 * 1以外のダイスの目のpathを作成
 * @param {number} pos 1:右上 2:右中 3:右下 4:中央 5:左上 6:左中 7:左下
 * @return {Pre3d.Path} 作成したpath
 * @private
 */
midice3d.DFace_.prototype.makeEyeP_ = function(pos) {
  var cp = Pre3d.PathUtils.makeCircle();
  pos = ~~pos;
  if (pos >= 1 && pos <= 7) {
    // 目の中心の座標取得
    var cx = this.cxyArr_[pos][0];
    var cy = this.cxyArr_[pos][1];
    // 目のPath作成
    midice3d.transPath_(cp, midice3d.con.ttype.t,
        {x: -this.hfwdth_, y: 0, z: this.hfwdth_});
    var eyeR = this.eyeRad_ / 0.5;
    midice3d.transPath_(cp, midice3d.con.ttype.s, {x:eyeR, y: eyeR, z: 1});
    midice3d.transPath_(cp, midice3d.con.ttype.t, {x:cx, y: cy, z: 0});
  }
  return cp;
};
