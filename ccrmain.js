/**
 * @fileoverview チンチロリンゲーム
 *  jquery1.4.4以降,mgbase.js, dice2d.js, dice3d.js, ccrorin.jsを前提とする。
 *  dice3d.js は pre3d(http://deanm.github.com/pre3d/)を前提とする。
 *  ccrorin.js はmt.js(http://homepage2.nifty.com/magicant/sjavascript/mt.html)
 *  を前提とする。
 * @author mimami24im@gmail.com
 */
 
/**
 * @namespace
 */
var ccrmain = {};

(function($) {

/* 定数 */
ccrmain.con = {
  id: { // id名
    cv: 'cv1', // Canvas
    sbtn: 'stbtn', // スタートボタン
    rbtn: 'rstbtn', // リセットボタン
    betbtn: 'betbtn', // 賭金決定ボタン
    bfbtn: 'betfixbtn', // 賭金固定／固定解除ボタン
    betinp: 'betinp', // 賭金入力エリア
    betb: 'betbar', // 賭金入力スライダーのバー
    betd: 'betdial', // 賭金入力スライダーのつまみ
    rotsel: 'rotsel', // 何巡で終了するか指定select
    sddiv: 'sddiv',  // スコア表示用 side div
    scwrapdiv: 'scwrapdiv',  // スコア表示divを囲うdiv
    scdivpre: 'sc',  // スコア表示div接頭辞
    rankdivpre: 'rank',  // 順位表示div接頭辞
    rotdiv: 'rotdiv', // 何巡目か表示div
    msgdiv: 'msgdiv', // メッセージ表示div
    bmsgdiv: 'betmsgdiv', // 賭金指定メッセージ表示div
    ldmsg: 'ldmsg'  // ロード中メッセージ表示div
  },
  clsname: {  // class名
    scdiv: 'scdiv',  // スコア表示div
    rankdiv: 'rankdiv',  // 順位表示div
    youdiv: 'youdiv',  // you div
    betdline0: 'line0',  // 賭金入力スライダーつまみの線デフォルト
    betdline1: 'line1'  // 賭金入力スライダーつまみの線ドラッグ中
  },
  str: { // 文字列
    st: 'スタート',
    sta: '再開',
    sp: '一時停止',
    bfix: '&nbsp;賭金固定&nbsp;',
    bunfix: '&nbsp;固定解除&nbsp;',
    betmsg: '賭金を指定してください',
    bfixmsg: '賭金固定中',
    end: '終了',
    bankr: '破産',
    parent: '親'
  },
  col: {  // 色
    btn0: '#000000',  // デフォルトのボタンの色 黒
    btn1: '#808080',  // 押せないボタンの色 グレー
    sdig0: '#e6e6e6', // スライダーのつまみデフォルト
    sdig1: '#f6f6f6', // スライダーのつまみドラッグ中
    str1: '#5555ff',  // 表示文字列 青
    str2: '#ff5555',  // 表示文字列 赤
    str3: '#454545', // 出目 グレー
    str4: '#000000', // 親 黒
    str5: '#00b300'  // 表示文字列 緑
  },
  num: { // 数値。特記していなければ canvas.height / 2 を1とした値
    dice2Dsz: 1 / 5,  // 2Dダイスのサイズ
    dice3Dsz: 0.5,  // 3Dダイスのサイズ。Canvas上のサイズとは異なる
    dice3Dfl: 0.6,  // 3Dダイスのfocal_length
    marginY: 20,  // 上下のマージン(px)
    updiceY: 0.6, // 上ダイス中心のY座標
    dwdiceY: 1.4, // 下ダイス中心のY座標
    sepdiceX: 0.55,  // 左右ダイス中心の、中央ダイス中心からの距離
    stfntsz: 20,  // スタートのフォントサイズ
    spfntsz: 14 // 一時停止のフォントサイズ
  },
  font: "'Arial', 'Tahoma', sans-serif"  // font-family
};

/* グローバル変数 */
ccrmain.dice2dins = null; // 2Dダイスインスタンス
ccrmain.dice3dins = null; // 3Dダイスインスタンス
ccrmain.game = null; // ゲーム実行インスタンス
ccrmain.act = null; // アクションインスタンス
ccrmain.canvas = null; // 表示対象canvas

/**
 * アクションクラス
 * @private
 * @constructor
 * @augments mgbase.Entity
 */
ccrmain.Action_ = function() {
  /**
   * プレイヤー数
   * @type {number}
   * @private
   */
  this.playnum_ = 4;
  /**
   * 振るダイスの個数。
   * @type {number}
   * @private
   */
  this.dicenum_ = 3;
  /**
   * 親が何巡したらゲーム終了とするか。
   * @type {number}
   */
  this.rottime = 3;
  /**
   * ダイスを振るのにかかる時間(フレーム数)。
   * 3Dのバッファは3種類で、最後のフレームで上を向かせるので、
   * 3の倍数-1が望ましい
   * @type {number}
   * @private
   */
  this.rolltime_ = 8;
  /**
   * ダイスを振るアクション用カウンター
   * @type {number}
   * @private
   */
  this.rollcounter_ = this.rolltime_;
  /**
   * 前回振ったときのbufidx
   * @type {number}
   * @private
   */
  this.bufidxbk_ = -1;
  /**
   * Youプレイヤーのindex。一番上を0とする
   * @type {number}
   */
  this.youidx = this.playnum_ - 1;
  /**
   * 3Dダイスプレイヤーのindex。一番上を0とする
   * @type {number}
   * @private
   */
  this.play3didx_ = this.playnum_ - 1;
  /**
   * ダイスを回転しているindex。一番上を0とする
   * @type {number}
   * @private
   */
  this.rollingidx_ = 0;
  /**
   * 親のindex。一番上を0とする
   * @type {number}
   * @private
   */
  this.parentidx_ = 0;
  /**
   * 各プレイヤーのダイスの目
   * @type {Array.<Array.<number>>}
   * @private
   */
  this.playeyeval_ = [];

  /* 座標関連 */
  /**
   * canvasの横幅の半分。
   * canvas.height / 2 を1とした値。
   * @type {number}
   * @private
   */
  this.cvwhf_ = 0;
  /**
   * canvas contextのフォントサイズ(px)
   * @type {number}
   */
  this.cvftsz = 0;
  /**
   * 左右ダイス中心の、中央ダイス中心からの距離。
   * canvas.height / 2 を1とした値。
   * @type {number}
   * @private
   */
  this.sepdiceX_ = 0;
  /**
   * 左右ダイス中心の、中央ダイス中心からの距離(px)
   * @type {number}
   * @private
   */
  this.sepdiceXpx_ = 0;
  /**
   * 各ダイスの中心X座標。
   * canvas.height / 2 を1とした値。
   * @type {Array.<number>}
   * @private
   */
  this.diceX_ = [];
  /**
   * 各プレイヤーのダイス中心のY座標。
   * canvas.height / 2 を1とした値。
   * @type {Array.<number>}
   * @private
   */
  this.diceY_ = [];
  /**
   * 各プレイヤーのダイス中心のY座標(px)
   * @type {Array.<number>}
   * @private
   */
  this.diceYpx_ = [];
  /**
   * 各プレイヤーのダイス描画前clearRect設定値
   * @type {Array.<{x: number, y: number, w: number, h: number}>}
   * @private
   */
  this.diceClrec_ = [];
  /**
   * 各プレイヤーの文字列ベースラインのY座標(px)
   * @type {Array.<number>}
   * @private
   */
  this.strYpx_ = [];
  /**
   * 親文字列中心のX座標(px)
   * @type {number}
   * @private
   */
  this.parentXpx_ = 0;
  /**
   * 最初の親マーク中心のX座標(px)
   * @type {number}
   * @private
   */
  this.iparentXpx_ = 0;
  /**
   * 最初の親マーク中心の半径(px)
   * @type {number}
   * @private
   */
  this.iparentrad_ = 0;
  /**
   * 各プレイヤーの親文字列描画前clearRect設定値
   * @type {Array.<{x: number, y: number, w: number, h: number}>}
   * @private
   */
  this.prClrec_ = [];
  /**
   * 出目文字列中心のX座標(px)
   * @type {number}
   * @private
   */
  this.dispstrXpx_ = 0;
  /**
   * 出目中心のX座標(px)
   * @type {number}
   * @private
   */
  this.playvalXpx_ = 0;
  /**
   * 各プレイヤーの出目描画前clearRect設定値
   * @type {Array.<{x: number, y: number, w: number, h: number}>}
   * @private
   */
  this.pvalClrec_ = [];
  /**
   * 賭金入力スライダー座標
   * @type {{x: number, y: number, w: number, h: number}}
   */
  this.sliderPos = {x: 0, y: 0, w: 0, h: 0};

  /* スコア関連 */
  /**
   * 各プレイヤーのスコア。
   * id: 表示divのid, sc: スコア
   * @type {Array.<{id: ?string, sc: number}>}
   * @private
   */
  this.score_ = [];
  /**
   * スコアの初期値。
   * @type {number}
   * @private
   */
  this.scini_ = 10000;
  /**
   * 賭金の単位。
   * @type {number}
   */
  this.betunit = 100;
  /**
   * 賭金のデフォルト値。
   * @type {number}
   * @private
   */
  this.betdef_ = 500;
  /**
   * 各プレイヤーの賭金の値。
   * @type {Array.<number>}
   */
  this.betval = [];
  /**
   * 賭金固定の場合はtrue。それ以外はfalse。
   * @type {boolean}
   */
  this.betfixed = false;
  /**
   * 勝負がついたので賭金再設定可能ならtrue。それ以外はfalse。
   * @type {boolean}
   * @private
   */
  this.resbet = false;
  /**
   * スコア表示完了後の時間間隔(フレーム数)。
   * @type {number}
   * @private
   */
  this.scafskip = 0;

  /**
   * チンチロリン出目管理クラス
   * @type {ccrorin.Ccrorin}
   * @private
   */
  this.ccrorin_ = new ccrorin.Ccrorin(this.playnum_, this.dicenum_);
};
ccrmain.Action_.prototype = new mgbase.Entity();

/**
 * 初期処理。インスタンス生成時に一度だけ実行
 */
ccrmain.Action_.prototype.init = function() {
  // リセット処理
  this.reset();
  
  /* 各種座標を求める */
  // 各プレイヤーのダイス中心,文字列ベースラインのY座標
  var cvhf = ccrmain.canvas.height / 2;
  var height = (ccrmain.canvas.height - 2 * ccrmain.con.num.marginY ) /
      this.playnum_;
  var dicewidth = cvhf * ccrmain.con.num.dice2Dsz;
  // ダイス中心から文字列ベースラインまでの距離
  var sepstrY = ~~(dicewidth / 2 - 10)
  for (var i = 0; i < this.playnum_; i++) {
    this.diceYpx_[i] = ~~(ccrmain.con.num.marginY + height / 2 + height * i);
    this.strYpx_[i] = this.diceYpx_[i] + sepstrY;
    this.diceY_[i] = this.diceYpx_[i] / cvhf;
  }
  // canvasの横幅の半分
  this.cvwhf_ = ccrmain.canvas.width / 2 / cvhf;
  // 左右ダイス中心の、中央ダイス中心からの距離
  this.sepdiceXpx_ = ~~(dicewidth * 1.5);
  this.sepdiceX_ = this.sepdiceXpx_ / cvhf;
  // 各ダイスの中心X座標
  for (var i = 0; i < this.dicenum_; i++) {
    this.diceX_[i] = this.cvwhf_ + this.sepdiceX_ * (i - 1);
  }
  // 各プレイヤーのダイス描画前clearRect設定値
  var mdicew = 1.4 * dicewidth;  // 余裕を持たせたダイスサイズ
  var diClrecX = ~~(this.diceX_[0] * cvhf - mdicew / 2);
  var diClrecW = ~~(mdicew + this.sepdiceXpx_ * (this.dicenum_ - 1));
  var diClrecH = ~~mdicew;
  var clrecY;
  for (var i = 0; i < this.playnum_; i++) {
    clrecY = ~~(this.diceYpx_[i] - mdicew / 2);
    this.diceClrec_[i] = {x: diClrecX, y: clrecY, w: diClrecW, h: diClrecH};
  }
  // 親文字列中心のX座標(px)
  this.parentXpx_ = ~~(ccrmain.canvas.width / 2 - this.sepdiceXpx_ * 2);
  // 最初の親マーク関連
  this.iparentXpx_ = ~~(this.parentXpx_ - this.cvftsz / 2);
  this.iparentrad_ = ~~(this.cvftsz / 4);
  // 出目文字列中心のX座標(px)
  this.dispstrXpx_ = ~~(ccrmain.canvas.width / 2);
  // 出目中心のX座標(px)
  this.playvalXpx_ = ~~(ccrmain.canvas.width / 2 + this.sepdiceXpx_ * 2);
  // 各プレイヤーの親文字列,出目描画前clearRect設定値
  var mcvftsz = ~~(1.1 * this.cvftsz);  // 余裕を持たせたフォントサイズ
  var prClrecX = this.iparentXpx_ - this.iparentrad_ - 1;
  var prClrecW = mcvftsz + this.iparentrad_ + 1;
  var pvalClrecX = ~~(this.playvalXpx_ - mcvftsz / 2);
  for (var i = 0; i < this.playnum_; i++) {
    clrecY = ~~(this.strYpx_[i] - mcvftsz);
    this.prClrec_[i] = {x: prClrecX, y: clrecY, w: prClrecW, h: mcvftsz + 10};
    this.pvalClrec_[i] = {x: pvalClrecX, y: clrecY, w: mcvftsz, h: mcvftsz + 10};
  }
  // 賭金入力スライダー座標
  var $betbar = $('#' + ccrmain.con.id.betb);
  var $betdial = $('#' + ccrmain.con.id.betd);
  this.sliderPos.x = $betbar.offset().left;
  this.sliderPos.y = $betdial.offset().top;
  this.sliderPos.w = $betbar.width();
  this.sliderPos.h = $betdial.height();
  // reset()では座標がセットされていないため、スライダー再表示
  var $betinp = $('#' + ccrmain.con.id.betinp);
  $betinp.val(this.betdef_);
  this.dispslider(this.betdef_);
};
/**
 * スコアのidセット
 * @param {Array.<string>} ids スコアのid
 */
ccrmain.Action_.prototype.setscid = function(ids) {
  for (var i = 0; i < this.playnum_; i++) {
    if (ids[i]) {
      this.score_[i].id = ids[i];
    }
  }
};
/**
 * リセット処理
 */
ccrmain.Action_.prototype.reset = function() {
  // 値の初期化
  this.rollcounter_ = this.rolltime_;
  this.bufidxbk_ = -1;
  // スコアリセット
  for (var i = 0; i < this.playnum_; i++) {
    if (this.score_[i]) {
      this.score_[i].sc = this.scini_;
    } else {
      this.score_[i] = {id: null, sc: this.scini_};
    }
    this.betval[i] = this.betdef_;
  }
  this.betval[this.youidx] = 0;
  // 賭金関連リセット
  this.betfixed = false;
  this.resbet = false;
  var $betinp = $('#' + ccrmain.con.id.betinp);
  $betinp.val(this.betdef_);
  this.dispslider(this.betdef_);
  // チンチロリン出目管理初期化
  this.ccrorin_.init();
  this.rollingidx_ = this.ccrorin_.rollingidx;
  this.parentidx_ = this.ccrorin_.parentidx;
  for (var i = 0; i < this.playnum_; i++) {
    this.playeyeval_[i] = this.ccrorin_.playeyeval[i].concat([]);
  }

  // css初期化
  var $sbtn = $('#' + ccrmain.con.id.sbtn);
  $sbtn.text(ccrmain.con.str.st);
  $sbtn.css('color', ccrmain.con.col.btn0);
  $sbtn.css('fontSize', ccrmain.con.num.stfntsz);
  $sbtn.attr('disabled', false);
  $('#' + ccrmain.con.id.msgdiv).css('display', 'none');
  var $bmsgdiv = $('#' + ccrmain.con.id.bmsgdiv);
  $bmsgdiv.text(ccrmain.con.str.betmsg);
  $bmsgdiv.css('display', 'none');
  for (i = 0; i < this.playnum_; i++) {
     $('#' + ccrmain.con.id.rankdivpre + i).css('display', 'none');
  }
  var $betbtn = $('#' + ccrmain.con.id.betbtn);
  $betbtn.css('color', ccrmain.con.col.btn1);
  $betbtn.attr('disabled', true);
  var $bfbtn = $('#' + ccrmain.con.id.bfbtn);
  $bfbtn.html(ccrmain.con.str.bfix);
  $bfbtn.css('color', ccrmain.con.col.btn1);
  $bfbtn.attr('disabled', true);
};
/**
 * 再描画
 * @param {CanvasRenderingContext2D} context 表示先canvasのcontext
 * @param {number} cvwidth canvas.width
 * @param {number} cvheight canvas.height
 */
ccrmain.Action_.prototype.drawAll = function(context, cvwidth, cvheight) {
  context.clearRect(0, 0, cvwidth, cvheight);
  // ダイス描画
  for (var i = 0; i < this.playnum_; i++) {
    this.drawdice_(context, i, 0);
  }
  // 出目描画
  context.save();
  context.globalAlpha = 1;
  context.fillStyle = ccrmain.con.col.str3;
  for (var i = 0; i < this.playnum_; i++) {
    context.fillText(this.ccrorin_.playval[i] + '', this.playvalXpx_,
        this.strYpx_[i]);
  }
  context.restore();
  // 最初の親マーク描画
  this.drawiparent_(context);
  // 親文字列描画
  context.save();
  context.globalAlpha = 1;
  context.fillStyle = ccrmain.con.col.str4;
  context.fillText(ccrmain.con.str.parent, this.parentXpx_,
      this.strYpx_[this.parentidx_]);
  context.restore();
  // 親が何巡したか表示
  this.disprotcnt_();
  // スコア表示
  var $scdiv;
  for (var i = 0; i < this.playnum_; i++) {
    $scdiv = $('#' + this.score_[i].id);
    $scdiv.text(this.score_[i].sc);
  }
};

/**
 * ダイスを表示する
 * @param {CanvasRenderingContext2D} context 表示先canvasのcontext
 */
ccrmain.Action_.prototype.draw = function(context) {
  // スコア表示中なら、スコア表示してreturn
  if (this.isscchg()) {
    this.dispscore_();
    return;
  }
  // 念のため、スコア表示完了後の時間間隔初期化
  this.scafskip = 0;

  // スコア表示後で、回転中でないなら、ダイス再描画
  // (出目文字列を消すため)
  if (this.rollcounter_ == this.rolltime_) {
    this.drawdice_(context, this.rollingidx_, 0);
  }

  // 出目が全て0なら表示されている出目初期化
  var playvalzero = true;
  for (var i = 0; i < this.ccrorin_.playval.length; i++) {
    if (this.ccrorin_.playval[i] != 0) {
      playvalzero = false;
      break;
    }
  }
  if (playvalzero) {
    // 表示されている出目初期化
    context.save();
    context.globalAlpha = 1;
    context.fillStyle = ccrmain.con.col.str3;
    var clrec;
    for (var i = 0; i < this.playnum_; i++) {
      clrec = this.pvalClrec_[i];
      context.clearRect(clrec.x, clrec.y, clrec.w, clrec.h);
      context.fillText('0', this.playvalXpx_, this.strYpx_[i]);
    }
    context.restore();
  }

  // 破産判定
  var isend = false;  // 終了ならtrue
  for (var i = 0; i < this.playnum_; i++) {
    if (this.score_[i].sc <= 0) {
      isend = true;
      // 終了/破産メッセージ表示
      var $msgdiv = $('#' + ccrmain.con.id.msgdiv);
      if (i == this.youidx) {
        $msgdiv.css('display', 'block').css('color', ccrmain.con.col.str1);
        $msgdiv.text(ccrmain.con.str.bankr);
      } else {
        $msgdiv.css('display', 'block').css('color', ccrmain.con.col.str2);
        $msgdiv.text(ccrmain.con.str.end);
      }
      // 終了処理
      var $sbtn = $('#' + ccrmain.con.id.sbtn);
      $sbtn.text(ccrmain.con.str.st);
      $sbtn.css('color', ccrmain.con.col.btn1);
      $sbtn.attr('disabled', true);
      ccrmain.game.stop();
      this.disprank_();
      // 終了画面の3Dダイス表示用
      this.bufidxbk_ = -1;
    }
  }

  // 親が交代したか判定
  if (this.parentidx_ != this.ccrorin_.parentidx && !isend) {
    this.parentidx_ = this.ccrorin_.parentidx;

    // 表示されている親文字列クリア
    for (var i = 0; i < this.playnum_; i++) {
      clrec = this.prClrec_[i];
      context.clearRect(clrec.x, clrec.y, clrec.w, clrec.h);
    }
    // 最初の親マーク描画
    this.drawiparent_(context);
    // 親文字列描画
    context.save();
    context.globalAlpha = 1;
    context.fillStyle = ccrmain.con.col.str4;
    context.fillText(ccrmain.con.str.parent, this.parentXpx_,
        this.strYpx_[this.parentidx_]);
    context.restore();

    // 親が何巡したか表示
    isend = this.disprotcnt_();
    if (isend) {
      // 終了処理
      var $sbtn = $('#' + ccrmain.con.id.sbtn);
      $sbtn.text(ccrmain.con.str.st);
      $sbtn.css('color', ccrmain.con.col.btn1);
      $sbtn.attr('disabled', true);
      ccrmain.game.stop();
      this.disprank_();
      // 終了画面の3Dダイス表示用
      this.bufidxbk_ = -1;
    }
  }
  this.rollingidx_ = this.ccrorin_.rollingidx;

  // 賭金を入力させる
  if (this.parentidx_ != this.youidx && this.betval[this.youidx] == 0
      && !isend) {
    var $sbtn = $('#' + ccrmain.con.id.sbtn);
    $sbtn.css('color', ccrmain.con.col.btn1);
    $sbtn.attr('disabled', true);
    var $betbtn = $('#' + ccrmain.con.id.betbtn);
    $betbtn.css('color', ccrmain.con.col.btn0);
    $betbtn.attr('disabled', false);
    var $bfbtn = $('#' + ccrmain.con.id.bfbtn);
    $bfbtn.css('color', ccrmain.con.col.btn0);
    $bfbtn.attr('disabled', false);
    var $bmsgdiv = $('#' + ccrmain.con.id.bmsgdiv);
    $bmsgdiv.text(ccrmain.con.str.betmsg);
    $bmsgdiv.css('display', 'block');
    ccrmain.game.stop();
    // スライダーイベント付与
    $('#' + ccrmain.con.id.betd).mousedown(ccrmain.betslideMd_);
    // スライダー再表示
    var $betinp = $('#' + ccrmain.con.id.betinp);
    var betval = parseInt($betinp.val(), 10);
    var youscore = this.score_[this.youidx].sc;
    if (betval > youscore) {
      if (youscore > 0) {
        betval = youscore;
      } else {
        betval = 0;
      }
      $betinp.val(betval);
    }
    this.dispslider(betval);
    return;
  }

  // 回転中ならダイス描画してreturn
  if (this.rollcounter_ > 0) {
    var bufidx = 0;
    // 3dダイスのバッファindexを算出
    if (this.rollingidx_ == this.play3didx_) {
      bufidx = (this.bufidxbk_ + 1 < 3) ? (this.bufidxbk_ + 1) : 0;
      this.bufidxbk_ = bufidx;
    }
    // 目の値を求める
    for (var i = 0; i < this.dicenum_; i++) {
      this.playeyeval_[this.rollingidx_][i] = ~~(Math.random() * 6) + 1;
    }
    this.rollcounter_--;
    // ダイス描画
    this.drawdice_(context, this.rollingidx_, bufidx);
    return;
  } else {
    // 回転が終わった場合
    this.rollcounter_ = this.rolltime_;
    this.bufidxbk_ = 0;
  }
  
  // サイコロの目を求める
  this.resbet = false;
  var strtn = this.ccrorin_.shoot();
  this.playeyeval_[this.rollingidx_] =
      this.ccrorin_.playeyeval[this.rollingidx_].concat([]);
  // ダイス描画
  this.drawdice_(context, this.rollingidx_, 0);
  // 出目文字列描画
  if (strtn.dispstr) {
    context.save();
    context.globalAlpha = 0.8;
    if (strtn.dispstr) {
      context.fillStyle = strtn.strcol;
      context.fillText(strtn.dispstr, this.dispstrXpx_, 
          this.strYpx_[this.rollingidx_]);
    }
    context.restore();
  }
  // 出目描画
  if (strtn.val) {
    var clrec = this.pvalClrec_[this.rollingidx_];
    context.clearRect(clrec.x, clrec.y, clrec.w, clrec.h);
    context.save();
    context.globalAlpha = 1;
    context.fillStyle = ccrmain.con.col.str3;
    context.fillText(strtn.val + '', this.playvalXpx_,
      this.strYpx_[this.rollingidx_]);
    context.restore();
  }

  if (this.isscchg()) {
    // 親の値は使用しないためクリア
    this.ccrorin_.scchgval[this.parentidx_] = 0;
    // スコア表示完了後の値設定
    this.scafskip = this.ccrorin_.skiptime + strtn.skiptime;
    this.resbet = strtn.resbet;
  } else {
    // しばらく更新をスキップする
    ccrmain.game.skip(this.ccrorin_.skiptime + strtn.skiptime);
    if (strtn.resbet) {
      // 賭金がスコアを超えていないかチェック
      this.isbetoversc_();
      this.resbet = false;
    }
  }
};
/**
 * スコア変動値が存在するかチェック
 * @return {boolean} スコア変動値が存在する場合true。それ以外はfalse。
 */
ccrmain.Action_.prototype.isscchg = function() {
  var rtn = false;
  for (var i = 0; i < this.ccrorin_.scchgval.length; i++) {
    if (this.ccrorin_.scchgval[i] != 0) {
      rtn = true;
      break;
    }
  }
  return rtn;
}
/**
 * ダイス描画
 * @param {CanvasRenderingContext2D} context 表示先canvasのcontext
 * @param {number} idx 表示対象プレイヤーのindex。一番上を0とする。
 * @param {?number} bufidx 3Dダイスの場合のbuffer index。nullの場合は0とする。
 * @private
 */
ccrmain.Action_.prototype.drawdice_ = function(context, idx, bufidx) {
  var diceval = this.playeyeval_[idx];
  if (bufidx === null) {
    bufidx = 0;
  }
  // 描画前にclearRect
  var clrec = this.diceClrec_[idx];
  context.clearRect(clrec.x, clrec.y, clrec.w, clrec.h);
  // ダイス描画
  for (var i = 0; i < this.dicenum_; i++) {
    if (idx == this.play3didx_) {
      ccrmain.dice3dins.draw(bufidx, diceval[i], this.diceX_[i],
          this.diceY_[idx], false);
    } else {
      ccrmain.dice2dins.draw(diceval[i], this.diceX_[i], this.diceY_[idx],
          false);
    }
  }
};
/**
 * 最初の親マーク描画
 * @param {CanvasRenderingContext2D} context 表示先canvasのcontext
 * @private
 */
ccrmain.Action_.prototype.drawiparent_ = function(context) {
  context.save();
  context.globalAlpha = 0.5;
  context.fillStyle = ccrmain.con.col.str2;
  context.beginPath();
  context.arc(this.iparentXpx_, this.diceYpx_[this.ccrorin_.parentidx0],
      this.iparentrad_, 0, Math.PI * 2, true);
  context.fill();
  context.restore();
};
/**
 * スコア表示
 * @private
 */
ccrmain.Action_.prototype.dispscore_ = function() {
  var scchgval = this.ccrorin_.scchgval;
  if (scchgval.length > 0) {
    // 表示スコア変更
    for (var i = 0; i < this.playnum_; i++) {
      if (scchgval[i] > 0) {
        this.score_[i].sc += this.betval[i];
        this.score_[this.parentidx_].sc -= this.betval[i];
        // 無限ループを避けるため、一応整数化する
        scchgval[i] = ~~scchgval[i] - 1;
      } else if (scchgval[i] < 0) {
        this.score_[i].sc -= this.betval[i];
        this.score_[this.parentidx_].sc += this.betval[i];
        scchgval[i] = ~~scchgval[i] + 1;
      }
    }
    // 全ての値が0になったら初期化
    var allzero = true;
    for (var i = 0; i < scchgval.length; i++) {
      if (scchgval[i] != 0) {
        allzero = false;
        break;
      }
    }
    if (allzero) {
      // 初期化
      this.ccrorin_.scchgval = [];
      if (this.resbet) {
        // 賭金がスコアを超えていないかチェック
        this.isbetoversc_();
        this.resbet = false;
      }
      // スコア表示完了後の時間間隔だけスキップ
      ccrmain.game.skip(this.scafskip);
      this.scafskip = 0;
    } else {
      this.ccrorin_.scchgval = scchgval.concat([]);
      // スコア表示間隔だけスキップ
      ccrmain.game.skip(this.ccrorin_.scskip);
    }
  }
  // スコア表示
  var $scdiv;
  for (var i = 0; i < this.playnum_; i++) {
    $scdiv = $('#' + this.score_[i].id);
    $scdiv.text(this.score_[i].sc);
  }
};
/**
 * 賭金がスコアを超えていないかチェック
 * @private
 */
ccrmain.Action_.prototype.isbetoversc_ = function() {
  var youscore = this.score_[this.youidx].sc;
  if (this.betval[this.youidx] > youscore) {
    // 賭金の値クリア
    this.betval[this.youidx] = 0;
    if (this.betfixed) {
      // 賭金固定解除
      ccrmain.betfix_();
    }
  } else if (!this.betfixed) {
    // 賭金の値クリア
    this.betval[this.youidx] = 0;
  }
}
/**
 * 賭金入力スライダー表示
 * @param {number} betval 賭金の値
 */
ccrmain.Action_.prototype.dispslider = function(betval) {
  var $betdial = $('#' + ccrmain.con.id.betd);
  var maxleft = ccrmain.act.sliderPos.w - $betdial.width();
  var dleft = ~~(betval * maxleft / this.score_[ccrmain.act.youidx].sc);
  $betdial.css('left', dleft + 'px');
};
/**
 * 賭金チェック
 * @param {number} betval 賭金の値
 * @return {?string} エラーメッセージ。正常の場合はnull
 */
ccrmain.Action_.prototype.chkbetval = function(betval) {
  betval = parseInt(betval, 10);
  var rtn = null;
  if (isNaN(betval)) {
    return '数値を入力してください';
  }
  if (betval > this.score_[this.youidx].sc) {
    return 'スコア以下の値を入力してください';
  }
  if (betval < this.betunit) {
    return this.betunit + '以上の値を入力してください';
  }
  return null;
};

/**
 * 親が何巡したか表示
 * @return {boolean} ゲーム終了ならtrue。それ以外はfalse
 * @private
 */
ccrmain.Action_.prototype.disprotcnt_ = function() {
  var rtn = false;
  var $rotdiv = $('#' + ccrmain.con.id.rotdiv);
  if (this.ccrorin_.rotcounter >= this.rottime) {
    var $msgdiv = $('#' + ccrmain.con.id.msgdiv);
    $msgdiv.css('display', 'block').css('color', ccrmain.con.col.str2);
    $msgdiv.text(ccrmain.con.str.end);
    rtn = true;
  } else {
    var rotcount = this.ccrorin_.rotcounter + 1;
    $rotdiv.text(rotcount + '巡目');
  }
  return rtn;
};
/**
 * 順位表示
 * @private
 */
ccrmain.Action_.prototype.disprank_ = function() {
  var scores = [];
  for (var i = 0; i < this.playnum_; i++) {
    scores[i] = {sc: this.score_[i].sc, idx: i};
  }
  scores.sort(ccrmain.scoresort);
  var rankidx, rank, score, $rankdiv;
  var rankbk = 0;
  var scorebk = 0;
  for (var i = 0; i < scores.length; i++) {
    // 1の位にセットしたindexを抽出。浮動小数点数誤差を考慮して小さい値を足す
    score = scores[i].sc;
    rankidx = scores[i].idx;
    if (score == scorebk) {
      rank = rankbk;
    } else {
      rank = rankbk + 1;
      rankbk = rank;
      scorebk = score;
    }
    $rankdiv = $('#' + ccrmain.con.id.rankdivpre + rankidx);
    $rankdiv.text(rank + '位');
    $rankdiv.css('display', 'block');
    if (rank == 1) {
      $rankdiv.css('color', ccrmain.con.col.str2);
    } else if (rank == scores.length) {
      $rankdiv.css('color', ccrmain.con.col.str1);
    } else {
      $rankdiv.css('color', ccrmain.con.col.str5);
    }
  }
};
/**
 * スコアソート用関数
 * .scの降順にソート
 * @param {{sc: number, idx: number}} a ソート対称
 * @param {{sc: number, idx: number}} b ソート対称
 * @return {number} a.sc < b.sc なら 正
 */
ccrmain.scoresort = function(a, b) {
  return (b.sc - a.sc);
}

/**
 * アクションスタート／ストップ
 * @private
 */
ccrmain.doact_ = function() {
  var $sbtn = $('#' + ccrmain.con.id.sbtn);
  if (ccrmain.game.isplaying()) {
    $sbtn.text(ccrmain.con.str.sta);
    $sbtn.css('fontSize', ccrmain.con.num.stfntsz);
    ccrmain.game.stop();
  } else {
    // ゲーム終了する親巡回回数取得
    var $rotsel = $('#' + ccrmain.con.id.rotsel);
    if (!$rotsel.attr('disabled')) {
      ccrmain.act.rottime = parseInt($('#' + ccrmain.con.id.rotsel +
          ' option:selected').val(), 10);
      $rotsel.attr('disabled', true);
    }
  
    $sbtn.text(ccrmain.con.str.sp);
    $sbtn.css('fontSize', ccrmain.con.num.spfntsz);
    ccrmain.game.start();
  }
};

/**
 * リセットして最初に戻す
 * @private
 */
ccrmain.reset_ = function() {
  if (ccrmain.game.isplaying()) {
    ccrmain.game.stop();
  }

  ccrmain.act.reset();
  // 再描画
  var gmcv = ccrmain.game.canvas;
  ccrmain.act.drawAll(gmcv.context_, gmcv.cvwidth_, gmcv.cvheight_);
  // スライダーのつまみ関連イベント削除
  ccrmain.betslideReset_();

  $('#' + ccrmain.con.id.rotsel).attr('disabled', false);
};

/**
 * 賭金決定
 * @private
 */
ccrmain.bet_ = function() {
  var $betinp = $('#' + ccrmain.con.id.betinp);
  var betval = parseInt($betinp.val(), 10);
  // 賭金チェック
  var rtn = ccrmain.act.chkbetval(betval);
  if (rtn) {
    window.alert(rtn);
    return;
  }
  // 賭金単位に合わせて切り捨て。浮動小数点数誤差を考慮して小さい数を足す
  betval = ~~(betval / ccrmain.act.betunit + 0.000001) * ccrmain.act.betunit;
  $betinp.val(betval);
  ccrmain.act.betval[ccrmain.act.youidx] = betval;
  var $bmsgdiv = $('#' + ccrmain.con.id.bmsgdiv);
  if (ccrmain.act.betfixed) {
    // 賭金固定中メッセージ表示
    $bmsgdiv.text(ccrmain.con.str.bfixmsg);
    $bmsgdiv.css('display', 'block');
  } else {
    // 賭金指定メッセージを消す
    $bmsgdiv.css('display', 'none');
  }
  // スライダーのつまみを賭金に合わせる
  ccrmain.act.dispslider(betval);
  // スライダーのつまみ関連イベント削除
  ccrmain.betslideReset_();
  // 一時停止ボタンを押せるようにする
  var $sbtn = $('#' + ccrmain.con.id.sbtn);
  $sbtn.css('color', ccrmain.con.col.btn0);
  $sbtn.attr('disabled', false);
  // 賭金関連ボタンを押せないようにする
  var $betbtn = $('#' + ccrmain.con.id.betbtn);
  $betbtn.css('color', ccrmain.con.col.btn1);
  $betbtn.attr('disabled', true);
  if (!ccrmain.act.betfixed) {
    var $bfbtn = $('#' + ccrmain.con.id.bfbtn);
    $bfbtn.css('color', ccrmain.con.col.btn1);
    $bfbtn.attr('disabled', true);
  }
  // アクションスタート
  ccrmain.game.start();
};
/**
 * 賭金固定/固定解除
 * @private
 */
ccrmain.betfix_ = function() {
  var $bfbtn = $('#' + ccrmain.con.id.bfbtn);
  if (ccrmain.act.betfixed) {
    // 固定解除
    $bfbtn.html(ccrmain.con.str.bfix);
    ccrmain.act.betfixed = false;
    // ボタンを押せないようにする
    $bfbtn.css('color', ccrmain.con.col.btn1);
    $bfbtn.attr('disabled', true);
    // 賭金固定中メッセージ非表示
    var $bmsgdiv = $('#' + ccrmain.con.id.bmsgdiv);
    $bmsgdiv.text(ccrmain.con.str.betmsg);
    $bmsgdiv.css('display', 'none');
  } else {
    // 賭金チェック
    var betval = parseInt($('#' + ccrmain.con.id.betinp).val(), 10);
    var rtn = ccrmain.act.chkbetval(betval);
    if (rtn) {
      window.alert(rtn);
      return;
    }
    // 賭金固定
    $bfbtn.html(ccrmain.con.str.bunfix);
    ccrmain.act.betfixed = true;
    ccrmain.bet_();
  }
};

/**
 * スライダーのつまみをクリックしたときに発生するイベント
 * @private
 */
ccrmain.betslideMd_ = function(evt) {
  evt.preventDefault();
  $(document).mouseup(ccrmain.betslideMu_);
  $(document).mousemove(ccrmain.betslideMm_);
  // CSS変更
  var $betdial = $('#' + ccrmain.con.id.betd);
  $betdial.css('backgroundColor', ccrmain.con.col.sdig1);
  $betdial.removeClass(ccrmain.con.clsname.betdline0);
  $betdial.addClass(ccrmain.con.clsname.betdline1);
};
/**
 * スライダーのつまみをmouseupしたときに発生するイベント
 * @private
 */
ccrmain.betslideMu_ = function() {
  $(document).unbind('mouseup', ccrmain.betslideMu_);
  $(document).unbind('mousemove', ccrmain.betslideMm_);
  // CSS変更
  var $betdial = $('#' + ccrmain.con.id.betd);
  $betdial.css('backgroundColor', ccrmain.con.col.sdig0);
  $betdial.removeClass(ccrmain.con.clsname.betdline1);
  $betdial.addClass(ccrmain.con.clsname.betdline0);
};
/**
 * スライダーのつまみをドラッグしたときに発生するイベント
 * @private
 */
ccrmain.betslideMm_ = function(evt) {
  var $betdial = $('#' + ccrmain.con.id.betd);
  var bdw = $betdial.width();
  var bdhfw = ~~(bdw / 2);
  var maxleft = ccrmain.act.sliderPos.w - bdw;
  // 最小賭金のleft算出
  var yourscore = ccrmain.act.score_[ccrmain.act.youidx].sc;
  var betunit = ccrmain.act.betunit;
  var minleft = ~~(betunit * maxleft / yourscore);

  // マウスカーソルがつまみの中心とする
  var mposx = evt.pageX - ccrmain.act.sliderPos.x; // マウスカーソルのX座標
  var dleft = mposx - bdhfw;  // つまみのleft
  if (dleft < minleft) {
    dleft = minleft;
  } else if (dleft > maxleft) {
    dleft = maxleft;
  }
  // 賭金算出
  var betval = ~~(dleft * yourscore / maxleft);
  // 賭金単位に合わせて切り捨て。浮動小数点数誤差を考慮して小さい数を足す
  betval = ~~(betval / betunit + 0.000001) * betunit;
  // 念のため上限下限チェック
  if (betval < betunit) {
    betval = betunit;
  } else if (betval > yourscore) {
    betval = yourscore;
  }
  // つまみのleft算出
  dleft = ~~(betval * maxleft / yourscore);
  $betdial.css('left', dleft + 'px');
  // 賭金再表示
  var $betinp = $('#' + ccrmain.con.id.betinp);
  $betinp.val(betval);
};
/**
 * スライダーのつまみ関連イベント削除
 * @private
 */
ccrmain.betslideReset_ = function() {
  $('#' + ccrmain.con.id.betd).unbind('mousedown', ccrmain.betslideMd_);
  ccrmain.betslideMu_();
};

//$(document).ready(function() {
$(window).load(function() {
  // HTMLCanvasElementを取得して、ゲーム実行インスタンス生成
  ccrmain.canvas = document.getElementById(ccrmain.con.id.cv);
  if ( ! ccrmain.canvas || ! ccrmain.canvas.getContext ) {
   return false;
  }
  ccrmain.cvhfheight = ccrmain.canvas.height / 2;
  var $cv = $('#' + ccrmain.con.id.cv);
  var cvoffset = $cv.offset();
  var cvx = cvoffset.left;
  var cvy = cvoffset.top;
  var fps = 12;
  ccrmain.game = new mgbase.Game(ccrmain.canvas, cvx, cvy);
  ccrmain.game.setfps(fps);
  // contextのテキスト設定
  var cvftsz = ~~(ccrmain.con.num.dice2Dsz * ccrmain.cvhfheight);
  ccrmain.game.canvas.context_.textAlign = 'center';
  ccrmain.game.canvas.context_.textBaseline = 'alphabetic';
  ccrmain.game.canvas.context_.font = 'bold ' + cvftsz + 'px ' +
      ccrmain.con.font;
  // draw前にclearRectしない設定
  ccrmain.game.canvas.isclear = false;

  // ダイスインスタンス生成
  ccrmain.dice2dins = new midice2d.Dice(ccrmain.canvas,
      ccrmain.con.num.dice2Dsz);
  ccrmain.dice3dins = new midice3d.Dice(ccrmain.canvas,
      ccrmain.con.num.dice3Dsz);
  ccrmain.dice3dins.camFocLen_ = ccrmain.con.num.dice3Dfl;
  ccrmain.dice3dins.init();

  // アクションインスタンス生成
  ccrmain.act = new ccrmain.Action_();
  ccrmain.game.canvas.push(ccrmain.act);
  $('#' + ccrmain.con.id.ldmsg).remove(); // ロード中メッセージ削除
  ccrmain.act.cvftsz = cvftsz;
  ccrmain.act.init();

  // スコアdivを追加し、idをアクションインスタンスにセット
  var marginY = ccrmain.con.num.marginY;
  var $sddiv = $('#' + ccrmain.con.id.sddiv);
  var $scwrapdiv = $('#' + ccrmain.con.id.scwrapdiv);
  var $scdiv;
  var scids = [];
  var lineheight = ~~(ccrmain.con.num.dice2Dsz * ccrmain.cvhfheight);
  var divheight = ~~(lineheight * 1.1);
  var divmrtop = ~~((ccrmain.canvas.height - 2 * marginY) /
      ccrmain.act.playnum_) - divheight;
  var fontsize = ~~(lineheight * 0.8);
  $scwrapdiv.css('top', ~~(marginY + divmrtop / 2) + 'px');
  for (var i = 0; i < ccrmain.act.playnum_; i++) {
    $scdiv = $('<div/>');
    scids[i] = ccrmain.con.id.scdivpre + i;
    $scdiv.addClass(ccrmain.con.clsname.scdiv).attr('id', scids[i]).
        css('fontSize', fontsize + 'px').css('lineHeight',lineheight + 'px').
        css('height', divheight + 'px');
    if (i > 0) {
      $scdiv.css('marginTop', divmrtop + 'px');
    }
    $scwrapdiv.append($scdiv);
  }
  ccrmain.act.setscid(scids);

  // 順位divを追加
  var $rankdiv, rdivtop;
  for (var i = 0; i < ccrmain.act.playnum_; i++) {
    $rankdiv = $('<div/>');
    scids[i] = ccrmain.con.id.scdivpre + i;
    $rankdiv.addClass(ccrmain.con.clsname.rankdiv).
        attr('id', ccrmain.con.id.rankdivpre + i).
        css('color', ccrmain.con.col.str5);
    rdivtop = (divheight + divmrtop) * i + marginY + divmrtop / 2 - 20;
    $rankdiv.css('top', rdivtop + 'px');
    $sddiv.append($rankdiv);
  }

  // you divを追加
  var $youdiv = $('<div/>');
  var ydivtop = (divheight + divmrtop) * ccrmain.act.play3didx_ +
      marginY + divmrtop / 2 - 20 + 'px';
  $youdiv.addClass(ccrmain.con.clsname.youdiv).css('top', ydivtop);
  $sddiv.append($youdiv);
  var $youstrdiv = $('<div/>');
  $youstrdiv.text('You');
  $youdiv.append($youstrdiv);

  // 何巡で終了するか指定selectのoption追加
  var $rotsel = $('#' + ccrmain.con.id.rotsel);
  var optval;
  for (var i = 0; i < 10; i++) {
    optval = i + 1;
    $rotsel.append($('<option val=' + optval + '>' + optval + '</option>'));
  }
  $rotsel.val('3');
  $rotsel.attr('disabled', false);

  // 初期画面表示
  var gmcv = ccrmain.game.canvas;
  ccrmain.act.drawAll(gmcv.context_, gmcv.cvwidth_, gmcv.cvheight_);

  // イベント付与
  $('#' + ccrmain.con.id.sbtn).click(ccrmain.doact_);
  $('#' + ccrmain.con.id.rbtn).click(ccrmain.reset_);
  $('#' + ccrmain.con.id.betbtn).click(ccrmain.bet_);
  $('#' + ccrmain.con.id.bfbtn).click(ccrmain.betfix_);
});

})(jQuery);
