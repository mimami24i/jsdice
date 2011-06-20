/**
 * @fileoverview チンチロリンゲーム
 *  jquery1.4.4以降,
 *  mt.js(http://homepage2.nifty.com/magicant/sjavascript/mt.html), 
 *  mgbase.js, dice2d.js, dice3d.jsを前提とする。
 *  dice3d.js は pre3d(http://deanm.github.com/pre3d/)を前提とする。
 * @author mimami24im@gmail.com
 */
 
/**
 * @namespace
 */
var ccrorin = {};

(function($) {

/* 定数 */
ccrorin.con = {
  id: { // id名
    cv: 'cv1', // Canvas
    sbtn: 'stbtn', // スタートボタン
    rbtn: 'rstbtn', // リセットボタン
    rotsel: 'rotsel', // 何巡で終了するか指定select
    sddiv: 'sddiv',  // スコア表示用 side div
    scwrapdiv: 'scwrapdiv',  // スコア表示divを囲うdiv
    scdivpre: 'sc',  // スコア表示div接頭辞
    rankdivpre: 'rank',  // 順位表示div接頭辞
    rotdiv: 'rotdiv', // 何巡目か表示div
    msgdiv: 'msgdiv', // メッセージ表示div
    ldmsg: 'ldmsg'  // ロード中メッセージ表示div
  },
  clsname: {  // class名
    scdiv: 'scdiv',  // スコア表示div
    rankdiv: 'rankdiv',  // 順位表示div
    youdiv: 'youdiv'  // you div
  },
  str: { // 文字列
    st: 'スタート',
    sta: '再開',
    sp: '一時停止',
    end: '終了',
    parent: '親',
    win: '勝ち',
    lose: '負け',
    draw: 'ワカレ',
    sdwin: '即勝ち',
    sdlose: '即負け',
    noeye: '目無し',
    payall: '総付け',
    dubget: '倍取り',
    dublose: '倍付け',
    arashi: 'アラシ'
  },
  col: {  // 色
    btn0: '#000000',  // デフォルトのボタンの色 黒
    btn1: '#808080',  // 実行中のボタンの色 グレー
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
ccrorin.dice2dins = null; // 2Dダイスインスタンス
ccrorin.dice3dins = null; // 3Dダイスインスタンス
ccrorin.game = null; // ゲーム実行インスタンス
ccrorin.act = null; // アクションインスタンス
ccrorin.mt = null; // Mersenne Twisterインスタンス
ccrorin.canvas = null; // 表示対象canvas

/**
 * アクションクラス
 * @private
 * @constructor
 * @augments mgbase.Entity
 */
ccrorin.Action_ = function() {
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
  this.dicesize_ = 3;
  /**
   * 親が何巡したらゲーム終了とするか。
   * @type {number}
   * @private
   */
  this.rottime_ = 1;
  //this.rottime_ = 5;
  /**
   * 親が何巡したかカウンター
   * @type {number}
   * @private
   */
  this.rotcounter_ = this.rottime_;
  /**
   * 親が何巡したかを表示する場合true。それ以外はfalse
   * @type {boolean}
   * @private
   */
  this.isdisprotcnt_ = false;
  /**
   * 最初の親のindex。一番上を0とする
   * @type {number}
   * @private
   */
  this.parentidx0_ = 0;
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
   * ダイスを振った後、次に振るまでの時間(フレーム数)。
   * @type {number}
   * @private
   */
  this.skiptime_ = 6;
  /**
   * 親交代/親続行が確定したときにskiptimeに加算する値
   * @type {number}
   * @private
   */
  this.skipaddP_ = 4;
  /**
   * 出目が確定して手番が移るときにskiptimeに加算する値
   * @type {number}
   * @private
   */
  this.skipaddC_ = 2;
  /**
   * 出目が出るまでどんぶりに振る回数
   * @type {number}
   * @private
   */
  this.chalcount_ = 3;
  /**
   * どんぶりに振った回数カウンター
   * @type {number}
   * @private
   */
  this.chalcounter_ = this.chalcount_;
  /**
   * ダイスが回転している状態の場合true。それ以外はfalse
   * @type {boolean}
   */
  this.rolling = false;
  /**
   * 前回振ったときのbufidx
   * @type {number}
   * @private
   */
  this.bufidxbk_ = -1;
  /**
   * 各プレイヤーのダイスの目
   * @type {Array.<Array.<number>>}
   * @private
   */
  this.playeyeval_ = [];
  /**
   * 各プレイヤーの出目
   * @type {Array.<number>}
   * @private
   */
  this.playval_ = [];
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
   * 親交代の場合はtrue。それ以外はfalse
   * @type {boolean}
   * @private
   */
  this.ischgparent_ = false;
  /**
   * canvasの横幅の半分。
   * canvas.height / 2 を1とした値。
   * @type {number}
   * @private
   */
  this.cvwhf_ = 0;
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
   * 親文字列中心のX座標(px)
   * @type {number}
   * @private
   */
  this.parentXpx_ = 0;
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
   * 各プレイヤーのスコア。
   * id: 表示divのid, sc: スコア
   * @type {Array.<{id: string, sc: number}>}
   * @private
   */
  this.score_ = [];
  /**
   * スコアの単位。
   * @type {number}
   * @private
   */
  this.scunit_ = 100;
  /**
   * スコアの初期値。
   * @type {number}
   * @private
   */
  this.scini_ = this.scunit_ * 100;
  /**
   * 各プレイヤーのスコア変動値。this.scunit_が単位。
   * スコア増ならプラス、スコア減ならマイナス
   * @type {Array.<number>}
   * @private
   */
  this.scchgval_ = [];
  /**
   * スコア表示の時間間隔(フレーム数)。
   * @type {number}
   * @private
   */
  this.scskip_ = 2;
  /**
   * 表示情報待避エリア
   * @type {?Object}
   * @private
   */
  this.dispinfobk_ = null;
};
ccrorin.Action_.prototype = new mgbase.Entity();

/**
 * 初期処理
 */
ccrorin.Action_.prototype.init = function() {
  // カウンターリセット
  this.resetcounter();
  // スコアリセット
  for (var i = 0; i < this.playnum_; i++) {
    if (this.score_[i]) {
      this.score_[i].sc = this.scini_;
    } else {
      this.score_[i] = {id: null, sc: this.scini_};
    }
  }
  // 最初の親を決める
  this.parentidx_ = ~~(Math.random() * this.playnum_);
  this.rollingidx_ = this.parentidx_;
  this.parentidx0_ = this.parentidx_;
  
  /* 各種座標を求める */
  // 各プレイヤーのダイス中心のY座標
  var cvhf = ccrorin.canvas.height / 2;
  var height = (ccrorin.canvas.height - 2 * ccrorin.con.num.marginY ) /
      this.playnum_;
  for (var i = 0; i < this.playnum_; i++) {
    this.diceYpx_[i] = ~~(ccrorin.con.num.marginY + height / 2 + height * i);
    this.diceY_[i] = this.diceYpx_[i] / cvhf;
  }
  // canvasの横幅の半分
  this.cvwhf_ = ccrorin.canvas.width / 2 / cvhf;
  // 左右ダイス中心の、中央ダイス中心からの距離
  var dicewidth = cvhf * ccrorin.con.num.dice2Dsz;
  this.sepdiceXpx_ = ~~(dicewidth * 1.5);
  this.sepdiceX_ = this.sepdiceXpx_ / cvhf;
  // 各ダイスの中心X座標
  for (var i = 0; i < this.dicesize_; i++) {
    this.diceX_[i] = this.cvwhf_ + this.sepdiceX_ * (i - 1);
  }
  // 親文字列中心のX座標(px)
  this.parentXpx_ = ~~(ccrorin.canvas.width / 2 - this.sepdiceXpx_ * 2);
  // 出目文字列中心のX座標(px)
  this.dispstrXpx_ = ~~(ccrorin.canvas.width / 2);
  // 出目中心のX座標(px)
  this.playvalXpx_ = ~~(ccrorin.canvas.width / 2 + this.sepdiceXpx_ * 2);

  // css初期化
  var $sbtn = $('#' + ccrorin.con.id.sbtn);
  $sbtn.css('color', ccrorin.con.col.btn0);
  $sbtn.css('fontSize', ccrorin.con.num.stfntsz);
  $sbtn.attr('disabled', false);
  $('#' + ccrorin.con.id.msgdiv).css('display', 'none');
  for (i = 0; i < this.playnum_; i++) {
     $('#' + ccrorin.con.id.rankdivpre + i).css('display', 'none');
  }

  // 次回のdrawで親が何巡したかを表示
  this.isdisprotcnt_ = true;
};
/**
 * スコアのidセット
 * @param {Array.<string>} ids スコアのid
 */
ccrorin.Action_.prototype.setscid = function(ids) {
  for (var i = 0; i < this.playnum_; i++) {
    if (ids[i]) {
      this.score_[i].id = ids[i];
    }
  }
};
/**
 * ダイスを表示する
 * @param {CanvasRenderingContext2D} context 表示先canvasのcontext
 */
ccrorin.Action_.prototype.draw = function(context) {
  if (this.isdisprotcnt_) {
    // 親が何巡したか表示
    var isend = this.disprotcnt_();
    if (isend) {
      // 終了処理
      var $sbtn = $('#' + ccrorin.con.id.sbtn);
      $sbtn.text(ccrorin.con.str.st);
      $sbtn.css('color', ccrorin.con.col.btn1);
      $sbtn.attr('disabled', true);
      ccrorin.game.stop();
      this.disprank_();
    }
  }

  // 目の値を求めると変わり得る情報待避
  var parentidx = this.parentidx_;
  var rollingidx = this.rollingidx_;

  var bufidx = 0; // 3dダイスのバッファindex
  var geteyeval = null;
  var dicescore = null;  // 出目判定結果
  var initplayval = false;  // 各プレイヤーの出目を初期化するか
  var skiptime = 0; // 表示後のskiptime
  if (!this.dispinfobk_ && !isend) {
    if (this.rolling) {
      // 目の値を求める
      geteyeval = this.getEyeVal_();
      bufidx = geteyeval.bufidx;
      dicescore = geteyeval.dicescore;
      initplayval = geteyeval.initplayval;
      skiptime = geteyeval.skiptime;
    } else {
      for (var i = 0; i < this.playnum_; i++) {
        this.playeyeval_[i] = [2, 2, 2];
        this.playval_[i] = 0;
      }
    }
  } else if (this.dispinfobk_) {
    // スコア表示中
    parentidx = this.dispinfobk_.parentidx;
    rollingidx = this.dispinfobk_.rollingidx;
    dispstr = this.dispinfobk_.dispstr;
    skiptime = this.dispinfobk_.skiptime;
  }

  // ダイス描画
  var diceval;
  for (var i = 0; i < this.playnum_; i++) {
    diceval = this.playeyeval_[i];
    for (var j = 0; j < this.dicesize_; j++) {
      if (i == this.play3didx_) {
        ccrorin.dice3dins.draw(bufidx, diceval[j], this.diceX_[j],
            this.diceY_[i], false);
      } else {
        ccrorin.dice2dins.draw(diceval[j], this.diceX_[j], this.diceY_[i],
            false);
      }
    }
  }

  // 親文字列描画
  context.save();
  context.globalAlpha = 1;
  context.fillStyle = ccrorin.con.col.str4;
  context.fillText(ccrorin.con.str.parent, this.parentXpx_,
      this.diceYpx_[parentidx]);
  context.restore();

  // 出目文字列描画
  context.save();
  context.globalAlpha = 0.8;
  var dispstr;
  if (dicescore && dicescore.dispstr) {
    if (dicescore.dispstr) {
      dispstr = dicescore.dispstr;
      if (dispstr == ccrorin.con.str.win ||
          dispstr == ccrorin.con.str.sdwin ||
          dispstr == ccrorin.con.str.dubget ||
          dispstr == ccrorin.con.str.arashi) {
        context.fillStyle = ccrorin.con.col.str2;
      } else if (dispstr == ccrorin.con.str.draw) {
        context.fillStyle = ccrorin.con.col.str3;
      } else {
        context.fillStyle = ccrorin.con.col.str1;
      }
      context.fillText(dispstr, this.dispstrXpx_, this.diceYpx_[rollingidx]);
    }
  }
  context.restore();

  // 出目描画
  context.save();
  context.globalAlpha = 1;
  context.fillStyle = ccrorin.con.col.str3;
  var playval;
  if (this.dispinfobk_) {
    playval = this.dispinfobk_.playval_;
  } else {
    playval = this.playval_;
  }
  for (var i = 0; i < this.playnum_; i++) {
    context.fillText(playval[i], this.playvalXpx_, this.diceYpx_[i]);
  }
  context.restore();

  // スコア表示
  if (this.scchgval_.length > 0) {
    if (!this.dispinfobk_) {
      // 現在の表示情報待避。スコアは変更しない
      this.dispinfobk_ = {};
      this.dispinfobk_.parentidx = parentidx;
      this.dispinfobk_.rollingidx = rollingidx;
      this.dispinfobk_.dispstr = dispstr;
      this.dispinfobk_.skiptime = skiptime;
      this.dispinfobk_.playval_ = this.playval_.concat([]);
    } else {
      this.dispscore_();
    }
  } else if (!this.rolling) {
    this.dispscore_();
  } else if (skiptime) {
    // しばらく更新をスキップする
    ccrorin.game.skip(skiptime);
    // 次回のdrawで親が何巡したかを表示
    this.isdisprotcnt_ = true;
  }

  if (initplayval) {
    this.initplayval_();
  }
};
/**
 * スコア表示
 * @private
 */
ccrorin.Action_.prototype.dispscore_ = function() {
  if (this.scchgval_.length > 0) {
    // 表示スコア変更
    for (var i = 0; i < this.playnum_; i++) {
      if (this.scchgval_[i] > 0) {
        this.score_[i].sc += this.scunit_;
        // 無限ループを避けるため、一応整数化する
        this.scchgval_[i] = ~~this.scchgval_[i] - 1;
      } else if (this.scchgval_[i] < 0) {
        this.score_[i].sc -= this.scunit_;
        this.scchgval_[i] = ~~this.scchgval_[i] + 1;
      }
    }
    // スコア表示間隔だけスキップ
    ccrorin.game.skip(this.scskip_);
    // 全ての値が0になったら初期化
    var allzero = true;
    for (var i = 0; i < this.scchgval_.length; i++) {
      if (this.scchgval_[i] != 0) {
        allzero = false;
        break;
      }
    }
    if (allzero) {
      // スコア表示後スキップ
      ccrorin.game.skip(this.dispinfobk_.skiptime);
      // 初期化
      this.scchgval_ = [];
      this.dispinfobk_ = null;
      // 次回のdrawで親が何巡したかを表示
      this.isdisprotcnt_ = true;
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
 * 親が何巡したか表示
 * @return {boolean} ゲーム終了ならtrue。それ以外はfalse
 * @private
 */
ccrorin.Action_.prototype.disprotcnt_ = function() {
  var rtn = false;
  var $rotdiv = $('#' + ccrorin.con.id.rotdiv);
  if (this.rotcounter_ <= 0) {
    $('#' + ccrorin.con.id.msgdiv).css('display', 'block');
    rtn = true;
  } else {
    var rotcount = this.rottime_ - this.rotcounter_ + 1;
    $rotdiv.text(rotcount + '巡目');
  }
  this.isdisprotcnt_ = false;
  return rtn;
};
/**
 * 順位表示
 * @private
 */
ccrorin.Action_.prototype.disprank_ = function() {
  var scores = [];
  for (i = 0; i < this.playnum_; i++) {
    scores[i] = {sc: this.score_[i].sc, idx: i};
  }
  scores.sort(ccrorin.scoresort);
  var rankidx, rank, score, $rankdiv;
  var rankbk = 0;
  var scorebk = 0;
  for (i = 0; i < scores.length; i++) {
    // 1の位にセットしたindexを抽出。浮動小数点誤差を考慮して小さい値を足す
    score = scores[i].sc;
    rankidx = scores[i].idx;
    if (score == scorebk) {
      rank = rankbk;
    } else {
      rank = rankbk + 1;
      rankbk = rank;
      scorebk = score;
    }
    $rankdiv = $('#' + ccrorin.con.id.rankdivpre + rankidx);
    $rankdiv.text(rank + '位');
    $rankdiv.css('display', 'block');
    if (rank == 1) {
      $rankdiv.css('color', ccrorin.con.col.str2);
    } else if (rank == scores.length) {
      $rankdiv.css('color', ccrorin.con.col.str1);
    } else {
      $rankdiv.css('color', ccrorin.con.col.str5);
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
ccrorin.scoresort = function(a, b) {
  return (b.sc - a.sc);
}
/**
 * 目の値を求める
 * @return {{bufidx: number, dicescore: ?ccrorin.EyeScore_,
 *    skiptime: number, initplayval: boolean}}
 *    bufidx: 3dダイスのバッファindex, dicescore: 出目判定結果,
 *    skiptime: スコア表示後のskiptime,
 *    initplayval: 各プレイヤーの出目を初期化する場合true。それ以外はfalse
 * @private
 */
ccrorin.Action_.prototype.getEyeVal_ = function() {
  var rtn = {bufidx: 0, dicescore: null, skiptime: 0, initplayval: false};
  /* 回転中なら回転を続ける */
  if (this.rollcounter_ > 0) {
    // 3dダイスのバッファindexを算出
    if (this.rollingidx_ == this.play3didx_) {
      rtn.bufidx = (this.bufidxbk_ + 1 < 3) ? (this.bufidxbk_ + 1) : 0;
      this.bufidxbk_ = rtn.bufidx;
    }
    // 目の値を求める
    for (var i = 0; i < this.dicesize_; i++) {
      this.playeyeval_[this.rollingidx_][i] = ~~(Math.random() * 6) + 1;
    }
    this.rollcounter_--;
    return rtn;
  }

  /* 回転が終わった場合 */
  this.rollcounter_ = this.rolltime_;
  this.bufidxbk_ = 0;
  // Mersenne Twister で最後の目の値を求める
  for (var i = 0; i < this.dicesize_; i++) {
     this.playeyeval_[this.rollingidx_][i] = ccrorin.mt.nextInt(1, 7);
  }

  var myeyeval = this.playeyeval_[this.rollingidx_];
  var isparent = (this.rollingidx_ == this.parentidx_);  // 親ならtrue
  // 出目判定
  var dicescore = this.checkEyeVal_(myeyeval, isparent);
  rtn.dicescore = dicescore;

  // 続行判定
  this.chalcounter_--;
  if (isparent) {
    if (dicescore.sudden) {
      // 即勝ち/即負け
      this.ischgparent_ = false;
      // スコア変動値設定
      this.scchgval_ = [];
      for (var i = 0; i < this.playnum_; i++) {
        if (i == this.parentidx_) {
          this.scchgval_[i] = dicescore.score * (this.playnum_ - 1);
        } else {
          this.scchgval_[i] = -dicescore.score;
        }
      }
      if (dicescore.score < 0) {
        // 親交代
        this.chgparent_();
      }
      rtn.skiptime += this.skipaddP_;
      rtn.initplayval = true;
    } else if (dicescore.val) {
      // 子供に手番が回る
      this.playval_[this.rollingidx_] = dicescore.val;
      this.chalcounter_ = this.chalcount_;
      this.rollingidx_ = this.nextplayer_(this.rollingidx_);
      rtn.skiptime += this.skipaddC_;
      this.ischgparent_ = false;
    } else if (this.chalcounter_ <= 0) {
      // 目無し。総付けして親交代
      // スコア変動値設定
      this.scchgval_ = [];
      for (var i = 0; i < this.playnum_; i++) {
        if (i == this.parentidx_) {
          this.scchgval_[i] = -1 * (this.playnum_ - 1);
        } else {
          this.scchgval_[i] = 1;
        }
      }
      rtn.dicescore.dispstr = ccrorin.con.str.noeye;
      this.chgparent_();
      rtn.skiptime += this.skipaddP_;
      this.ischgparent_ = false;
      rtn.initplayval = true;
    }
  } else {
    if (dicescore.val || this.chalcounter_ == 0) {
      this.playval_[this.rollingidx_] = dicescore.val;
      if (dicescore.sudden) {
        // 勝ち(子供の即負けは無い)
        this.ischgparent_ = true;
        // スコア変動値設定
        for (var i = 0; i < this.playnum_; i++) {
          this.scchgval_[i] = 0;
        }
        this.scchgval_[this.rollingidx_] = dicescore.score;
        this.scchgval_[this.parentidx_] = -dicescore.score;
      } else if (dicescore.val) {
        // 親に勝ったか判定
        if (dicescore.val > this.playval_[this.parentidx_]) {
          // 勝ち
          rtn.dicescore.dispstr = ccrorin.con.str.win;
          this.ischgparent_ = true;
          // スコア変動値設定
          for (var i = 0; i < this.playnum_; i++) {
            this.scchgval_[i] = 0;
          }
          this.scchgval_[this.rollingidx_] = dicescore.score;
          this.scchgval_[this.parentidx_] = -dicescore.score;
        } else if (dicescore.val == this.playval_[this.parentidx_]) {
          // ワカレ
          rtn.dicescore.dispstr = ccrorin.con.str.draw;
        } else {
          // 負け
          rtn.dicescore.dispstr = ccrorin.con.str.lose;
          // スコア変動値設定
          for (var i = 0; i < this.playnum_; i++) {
            this.scchgval_[i] = 0;
          }
          this.scchgval_[this.rollingidx_] = -dicescore.score;
          this.scchgval_[this.parentidx_] = dicescore.score;
        }
      } else {
        // 目無し
        rtn.dicescore.dispstr = ccrorin.con.str.lose;
        // スコア変動値設定
        for (var i = 0; i < this.playnum_; i++) {
          this.scchgval_[i] = 0;
        }
        this.scchgval_[this.rollingidx_] = -1;
        this.scchgval_[this.parentidx_] = 1;
      }
      // 次の子供へ手番が回る
      this.rollingidx_ = this.nextplayer_(this.rollingidx_);
      if (this.rollingidx_ == this.parentidx_) {
        // 子供全員が振り終わった場合
        if (this.ischgparent_) {
          // 親交代
          this.chgparent_();
        }
        rtn.skiptime += this.skipaddP_;
        this.ischgparent_ = false;
        rtn.initplayval = true;
      } else {
        this.chalcounter_ = this.chalcount_;
        rtn.skiptime += this.skipaddC_;
      }
    }
  }

  // しばらく更新をスキップする
  ccrorin.game.skip(this.skiptime_);

  return rtn;
};
/**
 * 出目情報初期化
 * @private
 */
ccrorin.Action_.prototype.initplayval_ = function() {
  this.chalcounter_ = this.chalcount_;
  for (var i = 0; i < this.playnum_; i++) {
    this.playval_[i] = 0;
  }
};
/**
 * 次のプレイヤーのindexを求める
 * @param {number} index 現在のプレイヤーのindex
 * @return {number} 次のプレイヤーのindex
 * @private
 */
ccrorin.Action_.prototype.nextplayer_ = function(index) {
  var nextidx = index + 1;
  if (nextidx >= this.playnum_) {
    nextidx = 0;
  }
  return nextidx;
};
/**
 * 親交代
 * @private
 */
ccrorin.Action_.prototype.chgparent_ = function() {
  this.parentidx_ = this.nextplayer_(this.parentidx_);
  this.rollingidx_ = this.parentidx_;
  if (this.parentidx_ == this.parentidx0_) {
    this.rotcounter_--;
  }
};
/**
 * 出目判定
 * @param {Array.<number>} eyeval 出目
 * @param {boolean} parent 親ならtrue。それ以外はfalse
 * @return {ccrorin.EyeScore_} 出目判定結果
 * @private
 */
ccrorin.Action_.prototype.checkEyeVal_ = function(eyeval, parent) {
  var eyescore = new ccrorin.EyeScore_();

  // アラシ判定
  if (eyeval[0] == eyeval[1] && eyeval[1] == eyeval[2]) {
    eyescore.sudden = 1;
    eyescore.val = 'A';
    eyescore.dispstr = ccrorin.con.str.arashi;
    if (eyeval[0] == 1) {
      eyescore.score = 10;
    } else {
      eyescore.score = eyeval[0];
    }
    return eyescore;
  }

  // eyevalをコピーしてソート
  var myeyeval = eyeval.concat([]);
  myeyeval.sort();
  // 倍取り/倍付け 判定
  if (parent) {
    if (myeyeval[0] == 1 && myeyeval[1] == 2 && myeyeval[2] == 3) {
      eyescore.sudden = 1;
      eyescore.dispstr = ccrorin.con.str.dublose;
      eyescore.score = -2;
      return eyescore;
    } else if (myeyeval[0] == 4 && myeyeval[1] == 5 && myeyeval[2] == 6) {
      eyescore.sudden = 1;
      eyescore.dispstr = ccrorin.con.str.dubget;
      eyescore.score = 2;
      return eyescore;
    }
  }

  // 出目判定
  if (myeyeval[0] == myeyeval[1] || myeyeval[1] == myeyeval[2]) {
    if (myeyeval[0] == myeyeval[1]) {
      eyescore.val = myeyeval[2];
    } else  {
      eyescore.val = myeyeval[0];
    }
    eyescore.score = 1;
    if (parent) {
      if (eyescore.val == 1) {
        eyescore.score = -1;
        eyescore.sudden = 1;
        eyescore.dispstr = ccrorin.con.str.sdlose;
      } else if (eyescore.val == 6) {
        eyescore.sudden = 1;
        eyescore.dispstr = ccrorin.con.str.sdwin;
      }
    }
    return eyescore;
  }
  
  return eyescore;
};
/**
 * アクション用カウンターリセット
 */
ccrorin.Action_.prototype.resetcounter = function() {
  this.rotcounter_ = this.rottime_;
  this.rollcounter_ = this.rolltime_;
  this.skipcounter_ = this.skiptime_;
};

/**
 * 出目判定結果クラス
 * @private
 * @constructor
 */
ccrorin.EyeScore_ = function() {
  /**
   * 出目。目無しなら0。アラシの場合'A'。
   * @type {number|string}
   */
  this.val = 0;
  /**
   * 即勝ち/即負けなら1、それ以外なら0
   * @type {number}
   */
  this.sudden = 0;
  /**
   * 表示文字列
   * ccrorin.con.str の値をセット
   * @type {string}
   */
  this.dispstr = '';
  /**
   * 支払金。掛け額を1とする。
   * もらうなら正、払うなら負
   * @type {number}
   */
  this.score = 0;
}

/**
 * アクションスタート／ストップ
 * @private
 */
ccrorin.doact_ = function() {
  var $sbtn = $('#' + ccrorin.con.id.sbtn);
  if (ccrorin.game.isplaying()) {
    $sbtn.text(ccrorin.con.str.sta);
    $sbtn.css('fontSize', ccrorin.con.num.stfntsz);
    ccrorin.game.stop();
  } else {
    // ゲーム終了する親巡回回数取得
    var $rotsel = $('#' + ccrorin.con.id.rotsel);
    if (!$rotsel.attr('disabled')) {
      ccrorin.act.rottime_ = parseInt($('#' + ccrorin.con.id.rotsel +
          ' option:selected').val());
      $rotsel.attr('disabled', true);
      ccrorin.act.resetcounter();
    }
  
    $sbtn.text(ccrorin.con.str.sp);
    $sbtn.css('fontSize', ccrorin.con.num.spfntsz);
    ccrorin.act.rolling = true;
    ccrorin.game.start();
  }
};

/**
 * リセットして最初に戻す
 * @private
 */
ccrorin.reset_ = function() {
  if (ccrorin.game.isplaying()) {
    ccrorin.game.stop();
  }
  var $sbtn = $('#' + ccrorin.con.id.sbtn);
  $sbtn.text(ccrorin.con.str.st);
  $sbtn.css('fontSize', ccrorin.con.num.stfntsz);

  ccrorin.act.init();
  var ctx = ccrorin.canvas.getContext('2d');
  ctx.clearRect(0, 0, ccrorin.canvas.width, ccrorin.canvas.height);
  ccrorin.act.rolling = false;
  ccrorin.act.draw(ctx);

  $('#' + ccrorin.con.id.rotsel).attr('disabled', false);
};

//$(document).ready(function() {
$(window).load(function() {
  // HTMLCanvasElementを取得して、ゲーム実行インスタンス生成
  ccrorin.canvas = document.getElementById(ccrorin.con.id.cv);
  if ( ! ccrorin.canvas || ! ccrorin.canvas.getContext ) {
   return false;
  }
  ccrorin.cvhfheight = ccrorin.canvas.height / 2;
  var $cv = $('#' + ccrorin.con.id.cv);
  var cvoffset = $cv.offset();
  var cvx = cvoffset.left;
  var cvy = cvoffset.top;
  var fps = 12;
  ccrorin.game = new mgbase.Game(ccrorin.canvas, cvx, cvy);
  ccrorin.game.setfps(fps);
  // contextのテキスト設定
  ccrorin.game.canvas.context_.textAlign = 'center';
  ccrorin.game.canvas.context_.textBaseline = 'middle';
  ccrorin.game.canvas.context_.font = 'bold ' +
      ~~(ccrorin.con.num.dice2Dsz * ccrorin.cvhfheight) + 'px ' +
      ccrorin.con.font;

  // ダイスインスタンス生成
  ccrorin.dice2dins = new midice2d.Dice(ccrorin.canvas,
      ccrorin.con.num.dice2Dsz);
  ccrorin.dice3dins = new midice3d.Dice(ccrorin.canvas,
      ccrorin.con.num.dice3Dsz);
  ccrorin.dice3dins.camFocLen_ = ccrorin.con.num.dice3Dfl;
  ccrorin.dice3dins.init();

  // Mersenne Twisterインスタンス生成
  ccrorin.mt = new MersenneTwister();

  // アクションインスタンス生成
  ccrorin.act = new ccrorin.Action_();
  ccrorin.game.canvas.push(ccrorin.act);
  $('#' + ccrorin.con.id.ldmsg).remove(); // ロード中メッセージ削除
  ccrorin.act.init();

  // スコアdivを追加し、idをアクションインスタンスにセット
  var marginY = ccrorin.con.num.marginY;
  var $sddiv = $('#' + ccrorin.con.id.sddiv);
  var $scwrapdiv = $('#' + ccrorin.con.id.scwrapdiv);
  var $scdiv;
  var scids = [];
  var lineheight = ~~(ccrorin.con.num.dice2Dsz * ccrorin.cvhfheight);
  var divheight = ~~(lineheight * 1.1);
  var divmrtop = ~~((ccrorin.canvas.height - 2 * marginY) /
      ccrorin.act.playnum_) - divheight;
  var fontsize = ~~(lineheight * 0.8);
  $scwrapdiv.css('top', ~~(marginY + divmrtop / 2) + 'px');
  for (var i = 0; i < ccrorin.act.playnum_; i++) {
    $scdiv = $('<div/>');
    scids[i] = ccrorin.con.id.scdivpre + i;
    $scdiv.addClass(ccrorin.con.clsname.scdiv).attr('id', scids[i]).
        css('fontSize', fontsize + 'px').css('lineHeight',lineheight + 'px').
        css('height', divheight + 'px');
    if (i > 0) {
      $scdiv.css('marginTop', divmrtop + 'px');
    }
    $scwrapdiv.append($scdiv);
  }
  ccrorin.act.setscid(scids);

  // 順位divを追加
  var $rankdiv, rdivtop;
  for (var i = 0; i < ccrorin.act.playnum_; i++) {
    $rankdiv = $('<div/>');
    scids[i] = ccrorin.con.id.scdivpre + i;
    $rankdiv.addClass(ccrorin.con.clsname.rankdiv).
        attr('id', ccrorin.con.id.rankdivpre + i).
    //    css('fontSize', fontsize + 'px').css('lineHeight',lineheight + 'px').
    //    css('height', lineheight + 'px').
        css('color', ccrorin.con.col.str5);
    rdivtop = (divheight + divmrtop) * i + marginY + divmrtop / 2 - 20;
    $rankdiv.css('top', rdivtop + 'px');
    $sddiv.append($rankdiv);
  }

  // you divを追加
  var $youdiv = $('<div/>');
  var ydivtop = (divheight + divmrtop) * ccrorin.act.play3didx_ +
      marginY + divmrtop / 2 - 20 + 'px';
  $youdiv.addClass(ccrorin.con.clsname.youdiv).css('top', ydivtop);
  $sddiv.append($youdiv);
  var $youstrdiv = $('<div/>');
  $youstrdiv.text('You');
  $youdiv.append($youstrdiv);

  // 何巡で終了するか指定selectのoption追加
  var $rotsel = $('#' + ccrorin.con.id.rotsel);
  var optval;
  for (var i = 0; i < 10; i++) {
    optval = i + 1;
    $rotsel.append($('<option val=' + optval + '>' + optval + '</option>'));
  }
  $rotsel.val('3');
  $rotsel.attr('disabled', false);

  // 初期画面表示
  ccrorin.act.draw(ccrorin.canvas.getContext('2d'));

  // イベント付与
  $('#' + ccrorin.con.id.sbtn).click(ccrorin.doact_);
  $('#' + ccrorin.con.id.rbtn).click(ccrorin.reset_);
});

})(jQuery);
