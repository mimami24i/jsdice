/**
 * @fileoverview ダイスを振る(2次元画像版)。
 * @author mimami24im@gmail.com
 */
 
/**
 * @namespace
 */
var midice2d = {};

/* 定数 */
midice2d.con = {
  pai2: 2 * Math.PI // 2π
};

/**
 * ダイスクラス。
 * @param {HTMLElement} canvas 表示対象HTMLCanvasElement
 * @param {number} width 1辺の長さ。canvas.height / 2 を1とする値。
 * @constructor
 */
midice2d.Dice = function(canvas, width) {
  /**
   * 表示対象canvasのcontext(CanvasRenderingContext2D)
   * @type {Object} 
   * @private
   */
  this.context_ = canvas.getContext('2d');
  /**
   * 表示対象canvasのサイズ(px)。w 幅、h 高さ
   * @type {{w: number, h: number}} 
   * @private
   */
  this.csz_ = {w: canvas.width, h: canvas.height};
  /**
   * 1辺の長さ(px)
   * @type {number}
   * @private
   */
  this.width_ = ~~(width * this.csz_.h / 2);
  /**
   * 輪郭線の色。CSSカラーを含んだ文字列を設定。
   * @type {string}
   * @private
   */
  this.linecol_ = '#080808';
  /**
   * 地の色。CSSカラーを含んだ文字列を設定。
   * @type {string}
   * @private
   */
  this.surfcol_ = '#FDFDFD';
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
   * 辺の太さ(px)
   * @type {number}
   * @private
   */
  this.lineWidth_ = 2;
  /**
   * 左上x座標(px)
   * @type {number}
   * @private
   */
  this.x_ = 0;
  /**
   * 左上y座標(px)
   * @type {number}
   * @private
   */
  this.y_ = 0;
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
   * 角を丸める部分の割合。0以上1以下の値をセット。
   * 0で正方形(角丸無し)。1で円(全て角丸)。
   * 計算が面倒なので、とりあえず0.1固定。
   * @type {number}
   * @private
   */
  this.cround_ = 0.1;
  /**
   * 4の目の丸の中心が、1辺の4分の1から外側にずれる部分の割合。
   * 0以上1以下の値をセット。
   * 1の目の中心から、4の目の丸の中心までのx座標上の距離は
   * this.width_ / 4 * (1 + this.cdist_) となる。
   * 計算が面倒なので、とりあえず0.1固定。
   * @type {number}
   * @private
   */
  this.cdist_ = 0.1;
  /**
   * 1以外の目の丸の半径(px)
   * @type {number}
   * @private
   */
  this.eyeRad_ = ~~(this.width_ * this.eyeRadRate_);
  /**
   * 1の目の丸の半径(px)
   * @type {number}
   * @private
   */
  this.eye1Rad_ = ~~(this.eyeRad_ * this.eye1RadRate_);
  /* 以下、表示用の値。詳細はmidice2d.Dice.prototype.calcDisp_参照 */
  this.cvhalfh_ = 0;
  this.crStLen_ = 0;
  this.distCir_ = 0;
  this.outX0_ = 0;
  this.outX1_ = 0;
  this.outX2_ = 0;
  this.outX3_ = 0;
  this.outY0_ = 0;
  this.outY1_ = 0;
  this.outY2_ = 0;
  this.outY3_ = 0;
  this.eyeX1_ = 0;
  this.eyeX2_ = 0;
  this.eyeX3_ = 0;
  this.eyeY1_ = 0;
  this.eyeY2_ = 0;
  this.eyeY3_ = 0;
};
/**
 * 表示用の値を計算
 * @private
 */
midice2d.Dice.prototype.calcDisp_ = function() {
  // canvas.height / 2 (px)
  this.cvhalfh_ = ~~(this.csz_.h / 2);
  // 左上座標
  this.x_ = ~~((this.csz_.w - this.width_) / 2);
  this.y_ = ~~((this.csz_.h - this.width_) / 2);
  // 頂点から角丸始点までの距離
  this.crStLen_ = ~~(this.width_ / 2 * this.cround_);
  // 1の目の中心から、4の目の丸の中心までのx座標上の距離
  this.distCir_ = ~~(this.width_ / 4 * (1 + this.cdist_));
  // 輪郭を描くのに必要な座標
  this.outX0_ = this.x_;
  this.outX1_ = this.x_ + this.crStLen_;
  this.outX2_ = this.x_ + this.width_ - this.crStLen_;
  this.outX3_ = this.x_ + this.width_;
  this.outY0_ = this.y_;
  this.outY1_ = this.y_ + this.crStLen_;
  this.outY2_ = this.y_ + this.width_ - this.crStLen_;
  this.outY3_ = this.y_ + this.width_;
  // 目の中心の座標
  var halfwidth = ~~(this.width_ / 2);
  this.eyeX1_ = this.x_ + halfwidth - this.distCir_;
  this.eyeX2_ = this.x_ + halfwidth;
  this.eyeX3_ = this.x_ + halfwidth + this.distCir_;
  this.eyeY1_ = this.y_ + halfwidth - this.distCir_;
  this.eyeY2_ = this.y_ + halfwidth;
  this.eyeY3_ = this.y_ + halfwidth + this.distCir_;
};
/**
 * ダイスの表示
 * @param {number} eyeval 目の値。1以上6以下の整数
 * @param {number} x 中心のX座標。canvas.height / 2 を1とする値。
 *    符号の向きはcanvasと同じ。
 * @param {number} y 中心のY座標。canvas.height / 2 を1とする値。
 *    符号の向きはcanvasと同じ。
 * @param {boolean} clrflg 描画前にCanvasをクリアするならtrue。それ以外はfalse
 */
midice2d.Dice.prototype.draw = function(eyeval, x ,y, clrflg) {
  // 表示用の値を計算していない場合、計算する
  if (!this.crStLen_) {
    this.calcDisp_();
  }
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
  tx = ~~(x * this.cvhalfh_ - this.csz_.w / 2);
  ty = ~~((y - 1) * this.cvhalfh_);
  
  var ctx = this.context_;
  if (clrflg) {
    ctx.clearRect(0, 0, this.csz_.w, this.csz_.h);
  }
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = this.surfcol_;
  ctx.strokeStyle = this.linecol_;
  ctx.lineWidth = this.lineWidth_;
  ctx.translate(tx, ty);

  // 輪郭を描画
  ctx.beginPath();
  ctx.moveTo(this.outX1_, this.outY0_);
  ctx.lineTo(this.outX2_, this.outY0_);
  ctx.quadraticCurveTo(this.outX3_, this.outY0_, this.outX3_, this.outY1_);
  ctx.lineTo(this.outX3_, this.outY2_);
  ctx.quadraticCurveTo(this.outX3_, this.outY3_, this.outX2_, this.outY3_);
  ctx.lineTo(this.outX1_, this.outY3_);
  ctx.quadraticCurveTo(this.outX0_, this.outY3_, this.outX0_, this.outY2_);
  ctx.lineTo(this.outX0_, this.outY1_);
  ctx.quadraticCurveTo(this.outX0_, this.outY0_, this.outX1_, this.outY0_);
  ctx.stroke();
  ctx.fill();

  // 目を描画
  // それぞれの目における、this.draweye_の引数配列
  var eyeposArr = [null, null, [1, 7], [1, 4, 7], [1, 3, 5, 7],
      [1, 3, 4, 5, 7], [1, 2, 3, 5, 6, 7]];
  switch (eyeval) {
    case 1: {
      ctx.beginPath();
      ctx.fillStyle = this.eye1col_;
      ctx.arc(this.eyeX2_, this.eyeY2_, this.eye1Rad_, 0,
          midice2d.con.pai2, true);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 2:
    case 3:
    case 4:
    case 5:
    case 6: {
      for (var i = 0; i < eyeposArr[eyeval].length; i++) {
        this.draweye_(eyeposArr[eyeval][i]);
      }
      break;
    }
    default: {
      break;
    }
  }
  ctx.restore();
};
/**
 * 1以外のダイスの目の表示
 * @param {number} pos 1:右上 2:右中 3:右下 4:中央 5:左上 6:左中 7:左下
 * @private
 */
midice2d.Dice.prototype.draweye_ = function(pos) {
  var cx = 0, cy = 0; // 中心座標
  switch (pos) {
    case 1: {
      cx = this.eyeX3_;
      cy = this.eyeY1_;
      break;
    }
    case 2: {
      cx = this.eyeX3_;
      cy = this.eyeY2_;
      break;
    }
    case 3: {
      cx = this.eyeX3_;
      cy = this.eyeY3_;
      break;
    }
    case 4: {
      cx = this.eyeX2_;
      cy = this.eyeY2_;
      break;
    }
    case 5: {
      cx = this.eyeX1_;
      cy = this.eyeY1_;
      break;
    }
    case 6: {
      cx = this.eyeX1_;
      cy = this.eyeY2_;
      break;
    }
    case 7: {
      cx = this.eyeX1_;
      cy = this.eyeY3_;
      break;
    }
    default: {
      break;
    }
  }
  
  this.context_.beginPath();
  this.context_.fillStyle = this.eyecol_;
  this.context_.arc(cx, cy, this.eyeRad_, 0, midice2d.con.pai2, true);
  this.context_.closePath();
  this.context_.fill();
};
