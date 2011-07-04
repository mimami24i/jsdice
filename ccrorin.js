/**
 * @fileoverview チンチロリン出目管理
 *  mt.js(http://homepage2.nifty.com/magicant/sjavascript/mt.html)
 *  を前提とする。
 * @author mimami24im@gmail.com
 */
 
/**
 * @namespace
 */
var ccrorin = {};

/* 定数 */
ccrorin.con = {
  str: { // 文字列
    win: '勝ち',
    lose: '負け',
    draw: 'ワカレ',
    sdwin: '即勝ち',
    sdlose: '即負け',
    noeye: '目無し',
    dubget: '倍取り',
    dublose: '倍付け',
    arashi: 'アラシ'
  },
  col: {  // 色
    str1: '#5555ff',  // 表示文字列 青
    str2: '#ff5555',  // 表示文字列 赤
    str3: '#454545' // 出目 グレー
  }
};

/* グローバル変数 */
ccrorin.mt = new MersenneTwister(); // Mersenne Twisterインスタンス

/**
 * チンチロリン出目管理クラス
 * @param {number} playnum プレイヤー数
 * @param {number} dicenum 振るダイスの個数
 * @constructor
 */
ccrorin.Ccrorin = function(playnum, dicenum) {
  /**
   * プレイヤー数
   * @type {number}
   * @private
   */
  this.playnum_ = playnum;
  /**
   * 振るダイスの個数。
   * @type {number}
   * @private
   */
  this.dicenum_ = dicenum;
  /**
   * 親が何巡したかカウンター
   * @type {number}
   */
  this.rotcounter = 0;
  /**
   * 最初の親のindex。一番上を0とする
   * @type {number}
   */
  this.parentidx0 = 0;
  /**
   * ダイスを回転しているindex。一番上を0とする
   * @type {number}
   */
  this.rollingidx = 0;
  /**
   * 親のindex。一番上を0とする
   * @type {number}
   */
  this.parentidx = 0;
  /**
   * 各プレイヤーのスコア変動値。賭金が単位。
   * スコア増ならプラス、スコア減ならマイナス
   * @type {Array.<number>}
   */
  this.scchgval = [];
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
   * 各プレイヤーのダイスの目
   * @type {Array.<Array.<number>>}
   */
  this.playeyeval = [];
  /**
   * 各プレイヤーの出目
   * @type {Array.<number|string>}
   */
  this.playval = [];
  /**
   * 親交代の場合はtrue。それ以外はfalse
   * @type {boolean}
   * @private
   */
  this.ischgparent_ = false;

  /* スキップ時間関連 */
  /**
   * ダイスを振った後、次に振るまでの時間(フレーム数)。
   * @type {number}
   */
  this.skiptime = 6;
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
   * スコア表示の時間間隔(フレーム数)。
   * @type {number}
   */
  this.scskip = 2;
};
/**
 * 初期処理
 */
ccrorin.Ccrorin.prototype.init = function() {
  // 値の初期化
  for (var i = 0; i < this.playnum_; i++) {
    this.playval[i] = 0;
    this.playeyeval[i] = [];
    for (var j = 0; j < this.dicenum_; j++) {
      this.playeyeval[i][j] = 2;
    }
  }
  this.rotcounter = 0;
  this.ischgparent_ = false;
  this.chalcounter_ = this.chalcount_;
  // 最初の親を決める
  this.parentidx = ~~(Math.random() * this.playnum_);
  this.rollingidx = this.parentidx;
  this.parentidx0 = this.parentidx;
};
/**
 * サイコロの目を求める
 * @return {{val: (number|string), dispstr: string, strcol: string,
 *    resbet: boolean, skiptime: number}}
 *    val: 出目。目無しなら0。アラシの場合'A',
 *    dispstr: 表示文字列。ccrorin.con.str の値をセット, strcol: dispstrの色,
 *    resbet: 勝負がついたので賭金再設定可能ならtrueそれ以外はfalse,
 *    skiptime: ダイス描画後のskiptime
 */
ccrorin.Ccrorin.prototype.shoot = function() {
  var rtn = {val: 0, dispstr: '', strcol: ccrorin.con.col.str3, resbet: false,
      skiptime: 0};

  // Mersenne Twister で目の値を求める
  for (var i = 0; i < this.dicenum_; i++) {
     this.playeyeval[this.rollingidx][i] = ccrorin.mt.nextInt(1, 7);
  }

  var myeyeval = this.playeyeval[this.rollingidx];
  var isparent = (this.rollingidx == this.parentidx);  // 親ならtrue
  // 出目判定
  var dicescore = this.checkEyeVal_(myeyeval, isparent);
  rtn.val = dicescore.val;
  rtn.dispstr = dicescore.dispstr;

  // 続行判定
  this.chalcounter_--;
  this.scchgval = [];
  if (isparent) {
    if (dicescore.sudden) {
      // 即勝ち/即負け
      // スコア変動値設定
      for (var i = 0; i < this.playnum_; i++) {
        if (i == this.parentidx) {
          this.scchgval[i] = dicescore.score * (this.playnum_ - 1);
        } else {
          this.scchgval[i] = -dicescore.score;
        }
      }
      if (dicescore.score < 0) {
        // 親交代
        this.chgparent_();
      }
      rtn.skiptime += this.skipaddP_;
      this.initplayval_();
      rtn.resbet = true;
    } else if (dicescore.val) {
      // 子供に手番が回る
      this.playval[this.rollingidx] = dicescore.val;
      this.chalcounter_ = this.chalcount_;
      this.rollingidx = this.nextplayer_(this.rollingidx);
      rtn.skiptime += this.skipaddC_;
    } else if (this.chalcounter_ <= 0) {
      // 目無し。総付けして親交代
      // スコア変動値設定
      for (var i = 0; i < this.playnum_; i++) {
        if (i == this.parentidx) {
          this.scchgval[i] = -1 * (this.playnum_ - 1);
        } else {
          this.scchgval[i] = 1;
        }
      }
      rtn.dispstr = ccrorin.con.str.noeye;
      this.chgparent_();
      rtn.skiptime += this.skipaddP_;
      this.initplayval_();
      rtn.resbet = true;
    }
  } else {
    if (dicescore.val || this.chalcounter_ == 0) {
      this.playval[this.rollingidx] = dicescore.val;
      if (dicescore.sudden) {
        // 勝ち(子供の即負けは無い)
        this.ischgparent_ = true;
        // スコア変動値設定
        for (var i = 0; i < this.playnum_; i++) {
          this.scchgval[i] = 0;
        }
        this.scchgval[this.rollingidx] = dicescore.score;
        this.scchgval[this.parentidx] = -dicescore.score;
      } else if (dicescore.val) {
        // 親に勝ったか判定
        // (dicescore.val, this.playval[]共に文字が入り得るが、
        // 文字の場合は dicescore.sudden == 1 になるので考慮しない)
        if (dicescore.val > this.playval[this.parentidx]) {
          // 勝ち
          rtn.dispstr = ccrorin.con.str.win;
          this.ischgparent_ = true;
          // スコア変動値設定
          for (var i = 0; i < this.playnum_; i++) {
            this.scchgval[i] = 0;
          }
          this.scchgval[this.rollingidx] = dicescore.score;
          this.scchgval[this.parentidx] = -dicescore.score;
        } else if (dicescore.val == this.playval[this.parentidx]) {
          // ワカレ
          rtn.dispstr = ccrorin.con.str.draw;
        } else {
          // 負け
          rtn.dispstr = ccrorin.con.str.lose;
          // スコア変動値設定
          for (var i = 0; i < this.playnum_; i++) {
            this.scchgval[i] = 0;
          }
          this.scchgval[this.rollingidx] = -dicescore.score;
          this.scchgval[this.parentidx] = dicescore.score;
        }
      } else {
        // 目無し
        rtn.dispstr = ccrorin.con.str.lose;
        // スコア変動値設定
        for (var i = 0; i < this.playnum_; i++) {
          this.scchgval[i] = 0;
        }
        this.scchgval[this.rollingidx] = -1;
        this.scchgval[this.parentidx] = 1;
      }
      // 次の子供へ手番が回る
      this.rollingidx = this.nextplayer_(this.rollingidx);
      if (this.rollingidx == this.parentidx) {
        // 子供全員が振り終わった場合
        if (this.ischgparent_) {
          // 親交代
          this.chgparent_();
        }
        rtn.skiptime += this.skipaddP_;
        this.initplayval_();
        rtn.resbet = true;
      } else {
        this.chalcounter_ = this.chalcount_;
        rtn.skiptime += this.skipaddC_;
      }
    }
  }

  // 出目文字列の色設定
  if (rtn.dispstr) {
    var dispstr = rtn.dispstr;
    if (dispstr == ccrorin.con.str.win ||
        dispstr == ccrorin.con.str.sdwin ||
        dispstr == ccrorin.con.str.dubget ||
        dispstr == ccrorin.con.str.arashi) {
      rtn.strcol = ccrorin.con.col.str2;
    } else if (dispstr == ccrorin.con.str.draw) {
      rtn.strcol = ccrorin.con.col.str3;
    } else {
      rtn.strcol = ccrorin.con.col.str1;
    }
  }

  return rtn;
};
/**
 * 出目情報初期化
 * @private
 */
ccrorin.Ccrorin.prototype.initplayval_ = function() {
  this.chalcounter_ = this.chalcount_;
  for (var i = 0; i < this.playnum_; i++) {
    this.playval[i] = 0;
  }
};
/**
 * 次のプレイヤーのindexを求める
 * @param {number} index 現在のプレイヤーのindex
 * @return {number} 次のプレイヤーのindex
 * @private
 */
ccrorin.Ccrorin.prototype.nextplayer_ = function(index) {
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
ccrorin.Ccrorin.prototype.chgparent_ = function() {
  this.parentidx = this.nextplayer_(this.parentidx);
  this.rollingidx = this.parentidx;
  if (this.parentidx == this.parentidx0) {
    this.rotcounter++;
  }
  this.ischgparent_ = false;
};
/**
 * 出目判定
 * @param {Array.<number>} eyeval 出目
 * @param {boolean} parent 親ならtrue。それ以外はfalse
 * @return {ccrorin.EyeScore_} 出目判定結果
 * @private
 */
ccrorin.Ccrorin.prototype.checkEyeVal_ = function(eyeval, parent) {
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
