/**
 * @fileoverview ゲーム基本部分
 * @author mimami24im@gmail.com
 */
 
/**
 * @namespace
 */
var mgbase = {};

/**
 * mgbase.Gameのインスタンス
 * @type {?mgbase.Game}
 */
mgbase.gmi = null;

/**
 * ゲーム実行クラス
 * @param {HTMLElement} canvas ゲーム表示先HTMLCanvasElement
 * @param {number} cvx ブラウザ上のCanvas左上x座標
 * @param {number} cvy ブラウザ上のCanvas左上y座標
 * @constructor
 */
mgbase.Game = function(canvas, cvx, cvy) {
  /**
   * Canvas表示、表示対象Entity管理クラス
   * @type {mgbase.Canvas}
   */
  this.gmcvs = new mgbase.Canvas(canvas);
  /**
   * ブラウザ上のCanvas左上x座標
   * 整数を設定することを推奨
   * @type {number}
   */
  this.cvx_ = ~~cvx;
  /**
   * ブラウザ上のCanvas左上y座標
   * 整数を設定することを推奨
   * @type {number}
   * @private
   */
  this.cvy_ = ~~cvy;
  /**
   * 1秒あたりのフレーム数
   * @type {number}
   * @private
   */
  this.fps_ = 24;
  /**
   * フレーム表示間隔(ミリ秒)
   * @type {number}
   * @private
   */
  this.mspf_ = 1000 / this.fps_;;
  /**
   * タイマー用ID
   * @private
   */
  this.timeoutID_ = null;
  /**
   * スキップ用カウンター
   * @type {number}
   * @private
   */
  this.skipcounter_ = 0;
  /**
   * スキップ中の場合true。それ以外はfalse
   * @type {boolean}
   * @private
   */
  this.isskip_ = false;
};
/**
 * 1秒あたりのフレーム数を設定
 * @param {number} fps 1秒あたりのフレーム数
 * @return {boolean} 正常に設定した場合true それ以外の場合false
 */
mgbase.Game.prototype.setfps = function(fps) {
  if (isNaN(fps) || fps < 1) {
    return false;
  }
  this.fps_ = ~~fps;
  this.mspf_ = 1000 / this.fps_;
  return true;
};
/**
 * ゲームを開始する
 */
mgbase.Game.prototype.start = function() {
  if (this.timeoutID_) {
    window.clearInterval(this.timeoutID_);
  }
  mgbase.gmi = this;
  this.timeoutID_ = window.setInterval(function() {
        mgbase.gmi.update_();
      }, this.mspf_);
};
/**
 * ゲームを停止する
 */
mgbase.Game.prototype.stop = function() {
  // ループ停止
  if (this.timeoutID_) {
    window.clearInterval(this.timeoutID_);
    this.timeoutID_ = null;
  }
  // 値の初期化
  if (this.isskip_) {
    this.skipcounter_ = 0;
    this.isskip_ = false;
  }
};
/**
 * ゲーム開始中か判定
 * @return {boolean} 開始中ならtrue。それ以外はfalse
 */
mgbase.Game.prototype.isplaying = function() {
  var playing = false;
  if (this.timeoutID_) {
    playing = true;
  }
  return playing;
};
/**
 * Canvasを更新する
 * @private
 */
mgbase.Game.prototype.update_ = function() {
  // スキップ中は更新しない
  if (this.isskip_) {
    this.skipcounter_--;
    if (this.skipcounter_ <= 0) {
      this.isskip_ = false;
    }
  } else {
    this.gmcvs.draw();
  }
};
/**
 * Canvasの更新をスキップする
 * @param {number} skiptime スキップ時間(フレーム数)
 */
mgbase.Game.prototype.skip = function(skiptime) {
  skiptime = ~~skiptime;
  if (skiptime < 0) {
    return;
  }
  this.skipcounter_ += skiptime;
  this.isskip_ = true;
};

/**
 * Canvas表示、表示対象Entity管理クラス
 * @param {HTMLElement} canvas ゲーム表示先HTMLCanvasElement
 * @constructor
 */
mgbase.Canvas = function(canvas) {
  /**
   * canvas 2d context
   * @type {?CanvasRenderingContext2D}
   * @private
   */
  this.context_ = null;
  if (canvas.getContext) {
    this.context_ = canvas.getContext('2d');
  }
  /**
   * canvasの幅(pixel)
   * @type {number}
   * @private
   */
  this.cvwidth_ = ~~canvas.width;
  /**
   * canvasの高さ(pixel)
   * @type {number}
   * @private
   */
  this.cvheight_ = ~~canvas.height;
  /**
   * entity配列(連想配列)。オブジェクトの参照を格納
   * @private
   * @type {Object.<number, mgbase.Entity>}
   */
  this.eArr_ = {};
  /**
   * entity配列のindex最大値
   * @private
   * @type {number}
   */
  this.eArrSeq_ = 0;
  /**
   * draw前にclearRectするか
   * @type {boolean}
   */
  this.isclear = true;
};
/**
 * entity追加
 * @param {mgbase.Entity} entity 追加対象entity
 * @return {?number} 追加したentityのindex。追加できなかった場合はnull
 */
mgbase.Canvas.prototype.push = function(entity) {
  var index = null;
  if (entity.addidx) {
    index = this.eArrSeq_;
    this.eArr_[index] = entity;
    this.eArrSeq_++;
    entity.addidx(index);
  }
  return index;
};
/**
 * entity削除
 * @param {mgbase.Entity} entity 削除対象entity
 * @return {?number} 削除したentityのindex。削除できなかった場合はnull
 */
mgbase.Canvas.prototype.del = function(entity) {
  var index = null;
  if (entity.getidx) {
    index = entity.getidx();
    delete this.eArr_[index];
  }
  return index;
};
/**
 * 全entity削除
 */
mgbase.Canvas.prototype.delall = function() {
  for (var entity in this.eArr_) {
    delete this.eArr_[entity];
  }
};
/**
 * Canvasにentityを描画
 */
mgbase.Canvas.prototype.draw = function() {
  if (this.isclear) {
    this.context_.clearRect(0, 0, this.cvwidth_, this.cvheight_);
  }
  for (var entity in this.eArr_) {
    this.eArr_[entity].draw(this.context_);
  }
};
/**
 * Canvasのcontextを取得
 * @return {{context: CanvasRenderingContext2D, cvwidth: number,
 *    cvheight: number}}
 * context: Canvasのcontext
 * cvwidth: Canvasのwidth(px)
 * cvheight: Canvasのheight(px)
 */
mgbase.Canvas.prototype.getcontext = function() {
  return {context: this.context_, cvwidth: this.cvwidth_,
      cvheight: this.cvheight_};
};
/**
 * contextのテキスト設定。paramがnullの場合は変更しない。
 * @param {?string} font context.font に設定する値
 * @param {?string} textAlign context.textAlign に設定する値
 * @param {?string} textBaseline context.textBaseline に設定する値
 */
mgbase.Canvas.prototype.setTextInfo = function(font, textAlign, textBaseline) {
  if (font) {
    this.context_.font = font;
  }
  if (textAlign) {
    this.context_.textAlign = textAlign;
  }
  if (textBaseline) {
    this.context_.textBaseline = textBaseline;
  }
};

/**
 * 表示対象Entityクラス
 * @constructor
 */
mgbase.Entity = function() {
  /**
   * entity配列のindex
   * @private
   * @type {?number}
   */
  this.eArrIdx_ = null;
};
/**
 * entity配列のindex付加
 * @param {?number} index 付加するindex
 */
mgbase.Entity.prototype.addidx = function(index) {
  this.eArrIdx_ = index;
};
/**
 * entity配列のindex取得
 * @return {?number} entity配列のindex
 */
mgbase.Entity.prototype.getidx = function() {
  return this.eArrIdx_;
};
/**
 * entityの表示
 * @param {CanvasRenderingContext2D} context ゲーム表示先canvasのcontext
 */
mgbase.Entity.prototype.draw = function(context) {
};
