(function(_window) {

  const keysByName =  (function() {
    // Based on: https://github.com/timoxley/keycode
    let codes = {
      'windows': 91,
      '⇧': 16,
      '⌥': 18,
      '⌃': 17,
      '⌘': 91,
      'control': 17,
      'ctl': 17,
      'ctrl': 17,
      'option': 18,
      'pause': 19,
      'break': 19,
      'caps': 20,
      'return': 13,
      'escape': 27,
      'esc': 27,
      'spc': 32,
      'insert': 45,
      'ins': 45,
      'delete': 46,
      'del': 46,
      'command': 91,
      'cmd': 91,
      'backspace': 8,
      'tab': 9,
      'enter': 13,
      'shift': 16,
      'alt': 18,
      'pause/break': 19,
      'caps lock': 20,
      'space': 32,
      'page up': 33,
      'pgup': 33,
      'page down': 34,
      'pgdn': 34,
      'end': 35,
      'home': 36,
      'left': 37,
      'up': 38,
      'right': 39,
      'down': 40,
      'left command': 91,
      'right command': 93,
      'numpad *': 106,
      'numpad +': 107,
      'numpad -': 109,
      'numpad .': 110,
      'numpad /': 111,
      'num lock': 144,
      'scroll lock': 145,
      'my computer': 182,
      'my calculator': 183,
      ';': 186,
      '=': 187,
      ',': 188,
      '-': 189,
      '.': 190,
      '/': 191,
      '`': 192,
      '[': 219,
      '\\': 220,
      ']': 221,
      '\'': 222
    };

    // lower case chars
    for (i = 97; i < 123; i++) codes[String.fromCharCode(i)] = i - 32

    // numbers
    for (var i = 48; i < 58; i++) codes[i - 48] = i

    // function keys
    for (i = 1; i < 13; i++) codes['f' + i] = i + 111

    // numpad keys
    for (i = 0; i < 10; i++) codes['numpad ' + i] = i + 96

    return codes;
  }());
  // Some keyName will get overwritten :)
  const keysByCode = (function(keys) {
    var inverted = {};
    for (var key in keys) {
      if (!keys.hasOwnProperty(key)) continue;
      inverted[keys[key]] = key;
    }
    return inverted;
  }(keysByName))


  debounce = function (func, wait) {
    let timeout = null;
    return function (args) {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        func(args);
      }, wait);
      return this;
    };
  };

  class KeyWatcher {
    constructor() {
      this.keyQueues = new Map();
    }
    resolveKey(key) {
      key = String(key).toLowerCase();
      if (!(key in keysByName)) {
        throw new Error(`key ${key} is undefined`);
        return null;
      }
      return keysByName[key];
    }

    flattenKeys(keys, isCombo = false) {
      let result = [];
      keys.forEach((key, index) => {
        if (Array.isArray(key)) {
          result = result.concat(this.flattenKeys(key, true));
          return;
        }
        result.push({
          key: this.resolveKey(key),
          resetOnKeyUp: isCombo
        });
      });
      return result;
    }
    find(name) {
      return this.keyQueues.get(name) || null;
    }
    add(name, keys, cb, opts) {
      if (this.find(name) !== null) throw new Error(`name ${name} is already declared`);
      const keyQueue = new KeyQueue(name, cb, opts);
      const flattenKeys = this.flattenKeys(keys);
      flattenKeys.forEach((keyObj) => {
        keyQueue.add(new KeyNode(keyObj.key, keyObj.resetOnKeyUp));
      });
      this.keyQueues.set(name, keyQueue);
      return this;
    }
    remove(name) {
      this.keyQueues.delete(name);
      if (!this.keyQueues.size) {
        eventListener.stop();
      }
      return this;
    }
    lookUp(key) {
      for (let [index, keyQueue] of this.keyQueues) {
        if (keyQueue.getCurrent().match(key)) {
          keyQueue.moveUp();
          continue;
        }
        keyQueue.reset();
      }
    }
    lookDown(key) {
      for (let [index, keyQueue] of this.keyQueues) {
        if (keyQueue.getCurrent().doesResetOnKeyUp()) {
          keyQueue.reset();
        }
      }
    }
  }

  const register = new KeyWatcher();

  class EventListener {
    constructor({ onKeyDown = function() {}, onKeyUp = function() {}}) {
      this.started = false;
      this.onKeyDown = this.onKeyDownWrapper(onKeyDown);
      this.onKeyUp = this.onKeyUpWrapper(onKeyUp);
      this.keyDownBlocker = {};
    }
    onKeyDownWrapper (onKeyDown) {
      return (e) => {
        let keyCode = parseInt(e.keyCode, 10);
        if (keyCode in this.keyDownBlocker) { 
          return;
        }
        this.keyDownBlocker[keyCode] = true;
        onKeyDown(keyCode);
      };
    }
    onKeyUpWrapper(onKeyUp) {
      return (e) => {
        let keyCode = parseInt(e.keyCode, 10);
        delete this.keyDownBlocker[keyCode];
        onKeyUp(keyCode);
      }
    }
    start () {
      this.stop();
      this.started = true;
      _window.addEventListener('keyup', this.onKeyUp); // Instead of keyup to handle combo key like: ctrl + a
      _window.addEventListener('keydown', this.onKeyDown); // Instead of keyup to handle combo key like: ctrl + a
      return this;
    }
    stop () {
      this.started = false;
      _window.removeEventListener('keyup', this.onKeyUp);
      _window.removeEventListener('keydown', this.onKeyDown);
      return this;
    }
    isStarted () {
      return this.started;
    }
  }
  const _elOnKeyUp = function() {};
  const eventListener = new EventListener({
    onKeyUp: function (keyCode) {
      public.trigger('keyup', keyCode);
      register.lookDown();
    },
    onKeyDown: function(keyCode) {
      public.trigger('keydown', keyCode);
      register.lookUp(keyCode);
    }
  });

  class KeyNode {
    constructor(key, resetOnKeyUp = false) {
      this.key = key;
      this.resetOnKeyUp = resetOnKeyUp;
      this.next = null;
    }
    setNext (keyNode) {
      this.next = keyNode;
      return this;
    }
    match (key) {
      return this.key ===  key;
    }
    getKey () {
      return this.key;
    }
    doesResetOnKeyUp () {
      return this.resetOnKeyUp;
    }
  }

  function genNewUid(name) {
    this.uid = 0;
    return function () {
      this.uid += 1;
      return String(name) + '_' + this.uid;
    }
  }
  const kqUidGen = genNewUid('kQ');

  class KeyQueue {
    constructor(name, cb, { onStep = function () { }, onReset = function () { } }) {
      this.name = name;
      this.keyNodes = [];
      this.onStep = this.onStepWrapper(onStep);
      this.onReset = this.onResetWrapper(onReset);
      this.index = 0;
      this.cb = cb;
    }
    onStepWrapper(onStep) {
      return () => {
        onStep(this.getCurrent().getKey(), this.index);
      };
    }
    onResetWrapper(onReset) {
      return () => {
        onReset(this.getCurrent().getKey(), this.index);
      };
    }
    add (keyNode) {
      this.keyNodes.push(keyNode);
      return this;
    }
    getCurrent () {
      return this.keyNodes[this.index];
    }
    reset () {
      this.onReset();
      this.index = 0;
      return this;
    }
    moveUp () {
      this.onStep();
      if (this.index + 1 >= this.keyNodes.length) {
        this.cb();
        this.reset();
      } else {
        this.index += 1;
      }
      return this;
    }
  }

  // Just for fun
  class Events {
    constructor() {
      this.events = {};
    }
    trigger(eventName, ...params) {
      if (!(eventName in this.events)) return this;
      for (let event of this.events[eventName]) {
        let args = [...params];
        args.push(event.cb.data); // Data will come at last parameter
        event.cb.apply(event.context, args);
      }
      return this;
    }
    off(eventName, cb) {
      if (!(eventName in this.events)) return this;
      if (!cb)
        delete this.events[eventName];
      else {
        for (let event of this.events[eventName]) {
          if (even.cb === cb) {
            delete this.events[eventName];
            break;
          }
        }
      }
      return this;
    }
    on(eventName, cb, opts) {
      if (!(eventName in this.events)) {
        this.events[eventName] = [];
      }
      opts = Object.assign({
        context: this,
        data: null
      }, opts);
      this.events[eventName].push({
        cb,
        opts
      });
    }
  }
  const events = new Events();

  class Public extends Events {
    constructor({ onKeyUp = function () { }, onKeyDown = function () { } }) {
      super();
      this._onKeyUp = onKeyUp;
      this.onKeyDown = onKeyDown;
    }
    /**
     * @param {String} name
     * @param {Array} keys
     * @param {function} cb
     * @param {Object} { onStep = function () {}, onReset = function () {} } 
     * @returns {this}
     */
    watch (name, keys, cb, { onStep = function () {}, onReset = function () {} }) {
      register.add(name, keys, cb, {
        onStep,
        onReset
      });
      if (!eventListener.isStarted()) {
        eventListener.start();
      }
      return this;
    }
    /**
     * @param {String} name
     * @returns {this}
     */
    unwatch (name) {
      register.remove(name);
      return this;
    }
    /**
     * @param {String} name 
     * @returns {Number}
     */
    getKeyCodeFromName (name) {
      return keysByName[name] || null;
    }
    /**
     * @param {Number} code 
     * @returns {String}
     */
    getKeyNameFromCode (code) {
      return keysByCode[code] || null;
    }
  }
  const public = new Public({ onKeyUp: _elOnKeyUp });
  _window.keyWatcher = public;
}(window));
