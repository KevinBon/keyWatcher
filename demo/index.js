(function(window) {
  const list = document.getElementById('events');
  const btnClearLogs = document.getElementById('clearLogs');
  const watcherContainer = document.getElementById('watcherContainer');
  btnClearLogs.addEventListener('click', (e) => {
    list.innerHTML = '';
  });

  function addEvent(eventName, source, ...params) {
    list.insertAdjacentHTML('afterbegin', `<li class="event"><span class="event-type event-type--${eventName}">${eventName}</span><span class="event-source event-source--${source}">${source}</span><span class="event-message">${JSON.stringify(params)}</span></li>`);
    forceScrollToLastRow();
  }
  function forceScrollToLastRow() {
  }

  class DemoWatcher {
    constructor(keys, name, renderTo, width = '100%') {
      this.keys = keys;
      this.name = name;
      this.width = width;
      this.trimmedName = this.name.replace(/\s/g, '');
      this.renderTo = renderTo;
      this.el = null;
    }
    flattenKeys(keys, combo = false) {
      let result = [];
      for (let i = 0, last = keys.length - 1, key = null; i < keys.length; i++) {
        key = keys[i];
        if (Array.isArray(key)) {
          result = result.concat(this.flattenKeys(key, true));
        } else {
          result.push({
            key,
            combo: combo,
            comboStart: (combo && i == 0), // Why do we get a string instead of a integer when pa? ("0" !== 0)
            comboEnd: (combo && i == last) // Why do we get a string instead of a integer when pa? ("0" !== 0)
          });
        }
      }
      return result;
    }
    renderKey(key, index) {
      return `
        ${(key.comboStart ? '<div class="link link-comboStart">(</div>' : '')}
        ${(index !== 0 ? `<div class="link link-${(key.combo ? 'combo' : 'normal')}">${(key.combo ? '+' : ',')}</div>` : '')}
        <div class="key" data-index="${index}">
          ${key.key}
        </div>
        ${(key.comboEnd ? '<div class="link link-comboEnd">)</div>' : '')}
      `;
    }
    onReset() {
      this.el.classList.remove('done');
      this.clearActiveKeys();
      keyWatcher.unwatch(this.name);
      this.start();
      return this;
    }
    listen() {
      this.el.querySelector(`[data-action="reset"]`).addEventListener('click', () => this.onReset());
      return this;
    }
    render() {
      const flattenKeys = this.flattenKeys(this.keys);
      let html = `
        <div class="watcher" style="width: ${this.width};" data-target="${this.trimmedName}">
          <div class="watcher--title">${this.name}</div>
          <section class="watcher--keyContainer">
            ${(flattenKeys.map(this.renderKey).join(''))}
            <div class="link link-normal">=</div>
            <div class="triggered hover-state pointer">
              <div class="hide--hover">Triggered!</div>
              <div class="show--hover" data-action="reset">&nbsp;(Click to restart)</div>
            </div>
          </section >
        </div >
      `;
      this.renderTo.insertAdjacentHTML('beforeEnd', html);
      this.el = this.renderTo.querySelector(`[data-target="${this.trimmedName}"]`);
      this.listen();
      return this;
    }
    clearActiveKeys() {
      const els = this.el.querySelectorAll(`[data-index].active`);
      if (!els || !els.length) return;
      els.forEach(function (el) {
        el.classList.remove('active');
      });
      return this;
    }
    start() {
      let done = false;
      keyWatcher.watch(this.name, this.keys, () => {
        done = true;
        keyWatcher.unwatch(this.name);
        this.el.classList.add('done');
        addEvent('done', this.name);
      }, {
          onStep: (key, index) => {
            this.el.querySelector(`[data-index="${index}"]`).classList.add('active');
            addEvent('step', this.name, arguments);
          },
          onReset: (key, index) => {
            if (!done) {
              this.clearActiveKeys();
            }
            addEvent('reset', this.name, arguments);
          }
        });
    }
  }

  keyWatcher.on('keyup', function (...params) {
    addEvent('keyup', 'global', ...params);
  });
  keyWatcher.on('keydown', function (...params) {
    addEvent('keyup', 'global', ...params);
  });
  
  const konamiCodeDemo = new DemoWatcher(['Up', 'Up', 'Down', 'Down', 'Left', 'Right', 'Left', 'Right', 'B', 'A'], 'KonamiCode', watcherContainer);
  const ctrlBDemo = new DemoWatcher(['ctrl', 'b'], 'Ctrl B', watcherContainer, '32%');
  const comboCtrlBDemo = new DemoWatcher([['ctrl', 'b']], 'Combo Ctrl B', watcherContainer, '33%');
  const comboCtrlBBDemo = new DemoWatcher([['ctrl', 'b'], 'b'], 'Combo Ctrl B B', watcherContainer, '33%');
  konamiCodeDemo.render().start();
  ctrlBDemo.render().start();
  comboCtrlBDemo.render().start();
  comboCtrlBBDemo.render().start();

}(window))