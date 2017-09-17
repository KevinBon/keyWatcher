# KeyWatcher

## Why?
Internet went down, I had to kill time and wanted to have fun with es6 + vanilla JS.

## What does it do?

You can use it to:
* Describe keyboard shortcuts that you want to watch and get notified for.
* and ... you can declare combo shortcuts (see demo/index.html)
* Translate keyboard Text to KeyCode ('escape' > 27)
* Translate keyboard keyCode to Text (27 > 'escape')

## Any documentation?

### Watch for global keyboard event
```js
  // (Only keyup and keydown are compatible)
  // Pressing the `escape` key`)
  keyWatcher.on('keyup', function (keyCode) {
    // keyCode = 27
  });
  keyWatcher.on('keydown', function (keyCode) {
    // keyCode = 27
  });
```

# I want to describe a keyboard shortcut
```js
  // -- You describe a sequence of keys that have to be pressed one by one
  // Konami Code
  const konamideCode = ['Up', 'Up', 'Down', 'Down', 'Left', 'Right', 'Left', 'Right', 'B', 'A'];
    /**
  * @param {String} name
  * @param {Array} keys
  * @param {function} cb
  * @param {Object} { onStep = function () {}, onReset = function () {} } 
  * @returns {this}
  */
  keyWatcher.watch('KonamiCode', konamideCode, function() {
    // Time to activate your super konami easter!
  });
```

# I want to watch a combo shortcut
```js
  // -- A combo must be declared in a sub array
  // Have to press to press Ctrl + B simultaneously
  keyWatcher.watch('ctrlB', [['ctrl', 'b']], function() {
    // Good good..
  });
```

# I want to convert a keyCode to a key name
```js
  /**
  * @param {Number} code 
  * @returns {String}
  */
  keyWatcher.getKeyNameFromCode(27);
  // 'escape'
```

# I want to convert a key name to a keyCode
```js
  /**
  * @param {String} name 
  * @returns {Number}
  */
  keyWatcher.getKeyCodeFromName('escape');
  // 27
```

# I want to stop listening to event
```js
  /**
  * @param {String} name
  * @returns {this}
  */
  keyWatcher.unwatch('KonamiCode');
  // KonamiCode will be removed from the watched sequences
```

# and ...
```js
  // If you add a 4th parameter to watch you can...
  keyWatcher.watch('ctrlB', [['ctrl', 'b']], function() {
    // ..
  }, {
    // Be aware when the queue change ...
    onStep: (key, index) => {
    },
    // and when a key reset the queue.
    onReset: (key, index) => {
    }
  });
```

## A demo please?
Open demo/index.html

## Before opening index.html
You have to be a strong...