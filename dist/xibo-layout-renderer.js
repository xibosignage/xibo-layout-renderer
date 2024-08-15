var XiboLayoutRenderer = (function () {
  'use strict';

  var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _regeneratorRuntime() {
    _regeneratorRuntime = function () {
      return e;
    };
    var t,
      e = {},
      r = Object.prototype,
      n = r.hasOwnProperty,
      o = Object.defineProperty || function (t, e, r) {
        t[e] = r.value;
      },
      i = "function" == typeof Symbol ? Symbol : {},
      a = i.iterator || "@@iterator",
      c = i.asyncIterator || "@@asyncIterator",
      u = i.toStringTag || "@@toStringTag";
    function define(t, e, r) {
      return Object.defineProperty(t, e, {
        value: r,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }), t[e];
    }
    try {
      define({}, "");
    } catch (t) {
      define = function (t, e, r) {
        return t[e] = r;
      };
    }
    function wrap(t, e, r, n) {
      var i = e && e.prototype instanceof Generator ? e : Generator,
        a = Object.create(i.prototype),
        c = new Context(n || []);
      return o(a, "_invoke", {
        value: makeInvokeMethod(t, r, c)
      }), a;
    }
    function tryCatch(t, e, r) {
      try {
        return {
          type: "normal",
          arg: t.call(e, r)
        };
      } catch (t) {
        return {
          type: "throw",
          arg: t
        };
      }
    }
    e.wrap = wrap;
    var h = "suspendedStart",
      l = "suspendedYield",
      f = "executing",
      s = "completed",
      y = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var p = {};
    define(p, a, function () {
      return this;
    });
    var d = Object.getPrototypeOf,
      v = d && d(d(values([])));
    v && v !== r && n.call(v, a) && (p = v);
    var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p);
    function defineIteratorMethods(t) {
      ["next", "throw", "return"].forEach(function (e) {
        define(t, e, function (t) {
          return this._invoke(e, t);
        });
      });
    }
    function AsyncIterator(t, e) {
      function invoke(r, o, i, a) {
        var c = tryCatch(t[r], t, o);
        if ("throw" !== c.type) {
          var u = c.arg,
            h = u.value;
          return h && "object" == typeof h && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) {
            invoke("next", t, i, a);
          }, function (t) {
            invoke("throw", t, i, a);
          }) : e.resolve(h).then(function (t) {
            u.value = t, i(u);
          }, function (t) {
            return invoke("throw", t, i, a);
          });
        }
        a(c.arg);
      }
      var r;
      o(this, "_invoke", {
        value: function (t, n) {
          function callInvokeWithMethodAndArg() {
            return new e(function (e, r) {
              invoke(t, n, e, r);
            });
          }
          return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
        }
      });
    }
    function makeInvokeMethod(e, r, n) {
      var o = h;
      return function (i, a) {
        if (o === f) throw Error("Generator is already running");
        if (o === s) {
          if ("throw" === i) throw a;
          return {
            value: t,
            done: !0
          };
        }
        for (n.method = i, n.arg = a;;) {
          var c = n.delegate;
          if (c) {
            var u = maybeInvokeDelegate(c, n);
            if (u) {
              if (u === y) continue;
              return u;
            }
          }
          if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) {
            if (o === h) throw o = s, n.arg;
            n.dispatchException(n.arg);
          } else "return" === n.method && n.abrupt("return", n.arg);
          o = f;
          var p = tryCatch(e, r, n);
          if ("normal" === p.type) {
            if (o = n.done ? s : l, p.arg === y) continue;
            return {
              value: p.arg,
              done: n.done
            };
          }
          "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg);
        }
      };
    }
    function maybeInvokeDelegate(e, r) {
      var n = r.method,
        o = e.iterator[n];
      if (o === t) return r.delegate = null, "throw" === n && e.iterator.return && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y;
      var i = tryCatch(o, e.iterator, r.arg);
      if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y;
      var a = i.arg;
      return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y);
    }
    function pushTryEntry(t) {
      var e = {
        tryLoc: t[0]
      };
      1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e);
    }
    function resetTryEntry(t) {
      var e = t.completion || {};
      e.type = "normal", delete e.arg, t.completion = e;
    }
    function Context(t) {
      this.tryEntries = [{
        tryLoc: "root"
      }], t.forEach(pushTryEntry, this), this.reset(!0);
    }
    function values(e) {
      if (e || "" === e) {
        var r = e[a];
        if (r) return r.call(e);
        if ("function" == typeof e.next) return e;
        if (!isNaN(e.length)) {
          var o = -1,
            i = function next() {
              for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next;
              return next.value = t, next.done = !0, next;
            };
          return i.next = i;
        }
      }
      throw new TypeError(typeof e + " is not iterable");
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", {
      value: GeneratorFunctionPrototype,
      configurable: !0
    }), o(GeneratorFunctionPrototype, "constructor", {
      value: GeneratorFunction,
      configurable: !0
    }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) {
      var e = "function" == typeof t && t.constructor;
      return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name));
    }, e.mark = function (t) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t;
    }, e.awrap = function (t) {
      return {
        __await: t
      };
    }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () {
      return this;
    }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) {
      void 0 === i && (i = Promise);
      var a = new AsyncIterator(wrap(t, r, n, o), i);
      return e.isGeneratorFunction(r) ? a : a.next().then(function (t) {
        return t.done ? t.value : a.next();
      });
    }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () {
      return this;
    }), define(g, "toString", function () {
      return "[object Generator]";
    }), e.keys = function (t) {
      var e = Object(t),
        r = [];
      for (var n in e) r.push(n);
      return r.reverse(), function next() {
        for (; r.length;) {
          var t = r.pop();
          if (t in e) return next.value = t, next.done = !1, next;
        }
        return next.done = !0, next;
      };
    }, e.values = values, Context.prototype = {
      constructor: Context,
      reset: function (e) {
        if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t);
      },
      stop: function () {
        this.done = !0;
        var t = this.tryEntries[0].completion;
        if ("throw" === t.type) throw t.arg;
        return this.rval;
      },
      dispatchException: function (e) {
        if (this.done) throw e;
        var r = this;
        function handle(n, o) {
          return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o;
        }
        for (var o = this.tryEntries.length - 1; o >= 0; --o) {
          var i = this.tryEntries[o],
            a = i.completion;
          if ("root" === i.tryLoc) return handle("end");
          if (i.tryLoc <= this.prev) {
            var c = n.call(i, "catchLoc"),
              u = n.call(i, "finallyLoc");
            if (c && u) {
              if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
              if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
            } else if (c) {
              if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
            } else {
              if (!u) throw Error("try statement without catch or finally");
              if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
            }
          }
        }
      },
      abrupt: function (t, e) {
        for (var r = this.tryEntries.length - 1; r >= 0; --r) {
          var o = this.tryEntries[r];
          if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
            var i = o;
            break;
          }
        }
        i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
        var a = i ? i.completion : {};
        return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a);
      },
      complete: function (t, e) {
        if ("throw" === t.type) throw t.arg;
        return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y;
      },
      finish: function (t) {
        for (var e = this.tryEntries.length - 1; e >= 0; --e) {
          var r = this.tryEntries[e];
          if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y;
        }
      },
      catch: function (t) {
        for (var e = this.tryEntries.length - 1; e >= 0; --e) {
          var r = this.tryEntries[e];
          if (r.tryLoc === t) {
            var n = r.completion;
            if ("throw" === n.type) {
              var o = n.arg;
              resetTryEntry(r);
            }
            return o;
          }
        }
        throw Error("illegal catch attempt");
      },
      delegateYield: function (e, r, n) {
        return this.delegate = {
          iterator: values(e),
          resultName: r,
          nextLoc: n
        }, "next" === this.method && (this.arg = t), y;
      }
    }, e;
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg);
      var value = info.value;
    } catch (error) {
      reject(error);
      return;
    }
    if (info.done) {
      resolve(value);
    } else {
      Promise.resolve(value).then(_next, _throw);
    }
  }
  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
        args = arguments;
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args);
        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
        }
        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
        }
        _next(undefined);
      });
    };
  }
  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key);
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }
  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }
  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
  }
  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }
  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _createForOfIteratorHelper(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
    if (!it) {
      if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike  ) {
        if (it) o = it;
        var i = 0;
        var F = function () {};
        return {
          s: F,
          n: function () {
            if (i >= o.length) return {
              done: true
            };
            return {
              done: false,
              value: o[i++]
            };
          },
          e: function (e) {
            throw e;
          },
          f: F
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var normalCompletion = true,
      didErr = false,
      err;
    return {
      s: function () {
        it = it.call(o);
      },
      n: function () {
        var step = it.next();
        normalCompletion = step.done;
        return step;
      },
      e: function (e) {
        didErr = true;
        err = e;
      },
      f: function () {
        try {
          if (!normalCompletion && it.return != null) it.return();
        } finally {
          if (didErr) throw err;
        }
      }
    };
  }

  var createNanoEvents = function createNanoEvents() {
    return {
      emit: function emit(event) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }
        for (var i = 0, callbacks = this.events[event] || [], length = callbacks.length; i < length; i++) {
          callbacks[i].apply(callbacks, args);
        }
      },
      events: {},
      on: function on(event, cb) {
        var _this$events,
          _this = this;
        ((_this$events = this.events)[event] || (_this$events[event] = [])).push(cb);
        return function () {
          var _this$events$event;
          _this.events[event] = (_this$events$event = _this.events[event]) === null || _this$events$event === void 0 ? void 0 : _this$events$event.filter(function (i) {
            return cb !== i;
          });
        };
      }
    };
  };

  var RESOURCE_URL = '/playlist/widget/resource/:regionId/:id';
  var XLF_URL = '/layout/xlf/:layoutId';
  var LAYOUT_BACKGROUND_DOWNLOAD_URL = '/layout/background/:id';
  var LAYOUT_PREVIEW_URL = '/layout/preview/[layoutCode]';
  var LIBRARY_DOWNLOAD_URL = '/library/download/:id';
  var LOADER_URL = '/theme/default/img/loader.gif';
  var platform = {
    getResourceUrl: RESOURCE_URL,
    xlfUrl: XLF_URL,
    layoutBackgroundDownloadUrl: LAYOUT_BACKGROUND_DOWNLOAD_URL,
    layoutPreviewUrl: LAYOUT_PREVIEW_URL,
    libraryDownloadUrl: LIBRARY_DOWNLOAD_URL,
    loaderUrl: LOADER_URL,
    idCounter: 0,
    inPreview: true,
    appHost: null,
    platform: 'CMS'
  };

  var initialLayout = {
    id: null,
    layoutId: null,
    sw: 0,
    sh: 0,
    xw: 0,
    xh: 0,
    zIndex: 0,
    scaleFactor: 1,
    sWidth: 0,
    sHeight: 0,
    offsetX: 0,
    offsetY: 0,
    bgColor: '',
    bgImage: '',
    bgId: '',
    containerName: '',
    layoutNode: null,
    regionMaxZIndex: 0,
    ready: false,
    regionObjects: [],
    drawer: [],
    allExpired: false,
    regions: [],
    actions: [],
    options: platform,
    done: false,
    allEnded: false,
    path: '',
    prepareLayout: function prepareLayout() {},
    parseXlf: function parseXlf() {},
    run: function run() {},
    on: function on(event, callback) {
      return {};
    },
    regionExpired: function regionExpired() {},
    end: function end() {},
    regionEnded: function regionEnded() {},
    stopAllMedia: function stopAllMedia() {
      return Promise.resolve();
    }
  };

  function nextId(options) {
    if (options.idCounter > 500) {
      options.idCounter = 0;
    }
    options.idCounter = options.idCounter + 1;
    return options.idCounter;
  }
  var getMediaId = function getMediaId(_ref) {
    var mediaType = _ref.mediaType,
      containerName = _ref.containerName;
    var mediaId = containerName;
    if (mediaType === 'video') {
      mediaId = mediaId + '-vid';
    } else if (mediaType === 'audio') {
      mediaId = mediaId + '-aud';
    }
    return mediaId;
  };
  var capitalizeStr = function capitalizeStr(inputStr) {
    if (inputStr === null) {
      return '';
    }
    return String(inputStr).charAt(0).toUpperCase() + String(inputStr).substring(1);
  };
  function getDataBlob(_x) {
    return _getDataBlob.apply(this, arguments);
  }
  function _getDataBlob() {
    _getDataBlob = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(src) {
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", fetch(src, {
              mode: 'no-cors'
            }).then(function (res) {
              return res.blob();
            }).then(function (blob) {
              return new Promise(function (res, rej) {
                var reader = new FileReader();
                reader.onloadend = function () {
                  return res(reader.result);
                };
                reader.onerror = rej;
                reader.readAsDataURL(blob);
              });
            }));
          case 1:
          case "end":
            return _context.stop();
        }
      }, _callee);
    }));
    return _getDataBlob.apply(this, arguments);
  }
  function preloadMediaBlob(_x2, _x3) {
    return _preloadMediaBlob.apply(this, arguments);
  }
  function _preloadMediaBlob() {
    _preloadMediaBlob = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(src, type) {
      var res, blob, data;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return fetch(src, {
              mode: 'no-cors'
            });
          case 2:
            res = _context2.sent;
            blob = new Blob();
            if (!(type === 'image')) {
              _context2.next = 8;
              break;
            }
            blob = new Blob();
            _context2.next = 19;
            break;
          case 8:
            if (!(type === 'video')) {
              _context2.next = 14;
              break;
            }
            _context2.next = 11;
            return res.blob();
          case 11:
            blob = _context2.sent;
            _context2.next = 19;
            break;
          case 14:
            if (!(type === 'audio')) {
              _context2.next = 19;
              break;
            }
            _context2.next = 17;
            return res.arrayBuffer();
          case 17:
            data = _context2.sent;
            blob = new Blob([data], {
              type: audioFileType(getFileExt(src))
            });
          case 19:
            return _context2.abrupt("return", URL.createObjectURL(blob));
          case 20:
          case "end":
            return _context2.stop();
        }
      }, _callee2);
    }));
    return _preloadMediaBlob.apply(this, arguments);
  }
  function fetchJSON(_x4) {
    return _fetchJSON.apply(this, arguments);
  }
  function _fetchJSON() {
    _fetchJSON = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(url) {
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            return _context3.abrupt("return", fetch(url).then(function (res) {
              return res.json();
            })["catch"](function (err) {
              console.debug(err);
            }));
          case 1:
          case "end":
            return _context3.stop();
        }
      }, _callee3);
    }));
    return _fetchJSON.apply(this, arguments);
  }
  function getFileExt(filename) {
    var filenameArr = String(filename).split('.');
    return filenameArr[filenameArr.length - 1];
  }
  function audioFileType(str) {
    var validAudioTypes = {
      'mp3': 'audio/mp3',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg'
    };
    if (Boolean(validAudioTypes[str])) {
      return validAudioTypes[str];
    }
    return undefined;
  }
  function composeResourceUrlByPlatform(platform, params) {
    var resourceUrl = params.regionOptions.getResourceUrl.replace(":regionId", params.regionId).replace(":id", params.mediaId) + '?preview=1&layoutPreview=1';
    if (platform === 'chromeOS') {
      resourceUrl = params.cmsUrl + '/chromeOS/resource/' + params.fileId + '?saveAs=' + params.uri;
    } else if (!Boolean(params['mediaType'])) {
      resourceUrl += '&scale_override=' + params.scaleFactor;
    }
    return resourceUrl;
  }
  function composeBgUrlByPlatform(platform, params) {
    var bgImageUrl = params.layoutBackgroundDownloadUrl.replace(":id", params.layout.id) + '?preview=1&width=' + params.layout.sWidth + '&height=' + params.layout.sHeight + '&dynamic&proportional=0';
    if (platform === 'chromeOS') {
      bgImageUrl = params.cmsUrl + '/chromeOS/resource/' + params.layout.id + '?saveAs=' + params.layout.bgImage;
    }
    return bgImageUrl;
  }
  function getIndexByLayoutId(layoutsInput, layoutId) {
    var layoutIndexes = layoutsInput.reduce(function (a, b, indx) {
      a[Number(b.layoutId)] = _objectSpread2(_objectSpread2({}, b), {}, {
        index: indx
      });
      return a;
    }, {});
    if (layoutId === null || !layoutId) {
      return layoutIndexes;
    }
    return layoutIndexes[layoutId];
  }
  function splashScreenDOM() {
    var mediaItem = document.querySelector('.media--item');
    var newImg = document.createElement('img');
    newImg.src = new URL(new URL('assets/logo-BLa_l1uk.png', document.currentScript && document.currentScript.src || document.baseURI).href, (_documentCurrentScript && _documentCurrentScript.src || new URL('xibo-layout-renderer.js', document.baseURI).href)).href;
    if (mediaItem !== null) {
      mediaItem.insertBefore(newImg, mediaItem.lastElementChild);
    }
    return newImg;
  }

  var initialRegion = {
    layout: initialLayout,
    id: '',
    regionId: '',
    xml: null,
    mediaObjects: [],
    mediaObjectsActions: [],
    currentMedia: -1,
    complete: false,
    containerName: '',
    ending: false,
    ended: false,
    oneMedia: false,
    oldMedia: undefined,
    curMedia: undefined,
    nxtMedia: undefined,
    currentMediaIndex: 0,
    totalMediaObjects: 0,
    ready: false,
    options: {},
    sWidth: 0,
    sHeight: 0,
    offsetX: 0,
    offsetY: 0,
    zIndex: 0,
    index: -1,
    prepareRegion: function prepareRegion() {},
    playNextMedia: function playNextMedia() {},
    transitionNodes: function transitionNodes() {},
    finished: function finished() {},
    run: function run() {},
    end: function end() {},
    exitTransition: function exitTransition() {},
    exitTransitionComplete: function exitTransitionComplete() {},
    on: function on(event, callback) {
      return {};
    },
    prepareMediaObjects: function prepareMediaObjects() {}
  };

  var initialMedia = {
    region: initialRegion,
    xml: null,
    id: '',
    index: 0,
    idCounter: 0,
    containerName: '',
    html: null,
    iframe: null,
    iframeName: '',
    mediaType: '',
    render: 'html',
    attachedAudio: false,
    singlePlay: false,
    timeoutId: setTimeout(function () {}, 100),
    ready: true,
    checkIframeStatus: false,
    loadIframeOnRun: false,
    tempSrc: '',
    finished: false,
    schemaVersion: '1',
    type: '',
    duration: 0,
    useDuration: Boolean(0),
    fileId: '',
    uri: '',
    options: {},
    divWidth: 0,
    divHeight: 0,
    url: null,
    loop: false,
    run: function run() {},
    init: function init() {},
    stop: function stop() {
      return Promise.resolve();
    },
    on: function on(event, callback) {
      return {};
    }
  };

  /*
   * Copyright (C) 2024 Xibo Signage Ltd
   *
   * Xibo - Digital Signage - https://www.xibosignage.com
   *
   * This file is part of Xibo.
   *
   * Xibo is free software: you can redistribute it and/or modify
   * it under the terms of the GNU Lesser General Public License as published by
   * the Free Software Foundation, either version 3 of the License, or
   * any later version.
   *
   * Xibo is distributed in the hope that it will be useful,
   * but WITHOUT ANY WARRANTY; without even the implied warranty of
   * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   * GNU Lesser General Public License for more details.
   *
   * You should have received a copy of the GNU Lesser General Public License
   * along with Xibo.  If not, see <http://www.gnu.org/licenses/>.
   */
  var defaultTrans = function defaultTrans(duration, trans) {
    var defaultKeyframes = [{
      display: trans === 'in' ? 'none' : 'block'
    }, {
      display: trans === 'out' ? 'none' : 'block'
    }];
    var defaultTiming = {
      duration: duration
    };
    return {
      keyframes: defaultKeyframes,
      timing: defaultTiming
    };
  };
  var fadeInElem = function fadeInElem(duration) {
    var fadeInKeyframes = [{
      opacity: 0
    }, {
      opacity: 1
    }];
    var fadeInTiming = {
      duration: duration,
      fill: 'forwards'
    };
    return {
      keyframes: fadeInKeyframes,
      timing: fadeInTiming
    };
  };
  var fadeOutElem = function fadeOutElem(duration) {
    var fadeOutKeyframes = [{
      opacity: 1
    }, {
      opacity: 0,
      zIndex: -1
    }];
    var fadeOutTiming = {
      duration: duration,
      fill: 'forwards'
    };
    return {
      keyframes: fadeOutKeyframes,
      timing: fadeOutTiming
    };
  };
  var flyInElem = function flyInElem(duration, keyframeOptions, direction) {
    var flyInKeyframes = [{
      opacity: 0
    }, {
      opacity: 1,
      zIndex: 1
    }];
    var flyInTiming = {
      duration: duration,
      fill: 'forwards'
    };
    if (keyframeOptions && Boolean(keyframeOptions.from)) {
      flyInKeyframes[0] = _objectSpread2(_objectSpread2({}, keyframeOptions.from), flyInKeyframes[0]);
    }
    if (keyframeOptions && Boolean(keyframeOptions.to)) {
      flyInKeyframes[1] = _objectSpread2(_objectSpread2({}, keyframeOptions.to), flyInKeyframes[1]);
    }
    return {
      keyframes: flyInKeyframes,
      timing: flyInTiming
    };
  };
  var flyOutElem = function flyOutElem(duration, keyframeOptions, direction) {
    var flyOutKeyframes = [{
      opacity: 1
    }, {
      opacity: 0,
      zIndex: -1
    }];
    var flyOutTiming = {
      duration: duration,
      fill: 'forwards'
    };
    if (keyframeOptions && Boolean(keyframeOptions.from)) {
      flyOutKeyframes[0] = _objectSpread2(_objectSpread2({}, keyframeOptions.from), flyOutKeyframes[0]);
    }
    if (keyframeOptions && Boolean(keyframeOptions.to)) {
      flyOutKeyframes[1] = _objectSpread2(_objectSpread2({}, keyframeOptions.to), flyOutKeyframes[1]);
    }
    return {
      keyframes: flyOutKeyframes,
      timing: flyOutTiming
    };
  };
  var transitionElement = function transitionElement(transition, options) {
    var transitions = {
      fadeIn: fadeInElem(options.duration),
      fadeOut: fadeOutElem(options.duration),
      flyIn: flyInElem(options.duration, options.keyframes, options.direction),
      flyOut: flyOutElem(options.duration, options.keyframes, options.direction),
      defaultIn: defaultTrans(options.duration, 'in'),
      defaultOut: defaultTrans(options.duration, 'out')
    };
    return transitions[transition];
  };
  var flyTransitionKeyframes = function flyTransitionKeyframes(params) {
    var keyframes = {
      from: {},
      to: {}
    };
    var opacityAttr = function opacityAttr(source) {
      if (source === 'from') {
        return params.trans === 'in' ? 0 : 1;
      }
      return params.trans === 'out' ? 1 : 0;
    };
    switch (params.direction) {
      case 'N':
        keyframes.from = {
          opacity: opacityAttr('from'),
          top: params.trans === 'in' ? "".concat(params.height, "px") : 0
        };
        keyframes.to = {
          opacity: opacityAttr('to'),
          top: params.trans === 'in' ? 0 : "-".concat(params.height, "px")
        };
        break;
      case 'NE':
        keyframes.from = {
          opacity: opacityAttr('from'),
          top: params.trans === 'in' ? "".concat(params.height, "px") : 0,
          left: params.trans === 'in' ? "-".concat(params.width, "px") : 0
        };
        keyframes.to = {
          opacity: opacityAttr('to'),
          top: params.trans === 'in' ? 0 : "-".concat(params.height, "px"),
          left: params.trans === 'in' ? 0 : "".concat(params.width, "px")
        };
        break;
      case 'E':
        keyframes.from = {
          opacity: opacityAttr('from'),
          left: params.trans === 'in' ? "-".concat(params.width, "px") : 0
        };
        keyframes.to = {
          opacity: opacityAttr('to'),
          left: params.trans === 'in' ? 0 : "".concat(params.width, "px")
        };
        break;
      case 'SE':
        keyframes.from = {
          opacity: opacityAttr('from'),
          top: params.trans === 'in' ? "-".concat(params.height, "px") : 0,
          left: params.trans === 'in' ? "-".concat(params.width, "px") : 0
        };
        keyframes.to = {
          opacity: opacityAttr('to'),
          top: params.trans === 'in' ? 0 : "".concat(params.height, "px"),
          left: params.trans === 'in' ? 0 : "".concat(params.width, "px")
        };
        break;
      case 'S':
        keyframes.from = {
          opacity: opacityAttr('from'),
          top: params.trans === 'in' ? "-".concat(params.height, "px") : 0
        };
        keyframes.to = {
          opacity: opacityAttr('to'),
          top: params.trans === 'in' ? 0 : "".concat(params.height, "px")
        };
        break;
      case 'SW':
        keyframes.from = {
          opacity: opacityAttr('from'),
          top: params.trans === 'in' ? "-".concat(params.height, "px") : 0,
          left: params.trans === 'in' ? "".concat(params.width, "px") : 0
        };
        keyframes.to = {
          opacity: opacityAttr('to'),
          top: params.trans === 'in' ? 0 : "".concat(params.height, "px"),
          left: params.trans === 'in' ? 0 : "-".concat(params.width, "px")
        };
        break;
      case 'W':
        keyframes.from = {
          opacity: opacityAttr('from'),
          left: params.trans === 'in' ? "".concat(params.width, "px") : 0
        };
        keyframes.to = {
          opacity: opacityAttr('to'),
          left: params.trans === 'in' ? 0 : "-".concat(params.width, "px")
        };
        break;
      case 'NW':
        keyframes.from = {
          opacity: opacityAttr('from'),
          top: params.trans === 'in' ? "".concat(params.height, "px") : 0,
          left: params.trans === 'in' ? "".concat(params.width, "px") : 0
        };
        keyframes.to = {
          opacity: opacityAttr('to'),
          top: params.trans === 'in' ? 0 : "-".concat(params.height, "px"),
          left: params.trans === 'in' ? 0 : "-".concat(params.width, "px")
        };
        break;
      default:
        keyframes.from = {
          opacity: opacityAttr('from'),
          top: params.trans === 'in' ? "".concat(params.height, "px") : 0
        };
        keyframes.to = {
          opacity: opacityAttr('to'),
          top: params.trans === 'in' ? 0 : "-".concat(params.height, "px")
        };
        break;
    }
    return keyframes;
  };

  function VideoMedia(media) {
    var videoMediaObject = {
      init: function init() {
        var $videoMedia = document.getElementById(getMediaId(media));
        if ($videoMedia) {
          $videoMedia.onloadstart = function () {
            console.debug("".concat(capitalizeStr(media.mediaType), " for media > ").concat(media.id, " has started loading data . . ."));
          };
          $videoMedia.onloadeddata = function () {
            if ($videoMedia.readyState >= 2) {
              console.debug("".concat(capitalizeStr(media.mediaType), " data for media > ").concat(media.id, " has been fully loaded . . ."));
            }
          };
          $videoMedia.oncanplay = function () {
            console.debug("".concat(capitalizeStr(media.mediaType), " for media > ").concat(media.id, " can be played . . ."));
            var videoPlayPromise = $videoMedia.play();
            if (videoPlayPromise !== undefined) {
              videoPlayPromise.then(function () {
                console.debug('autoplay started . . .');
                // Autoplay restarted
              })["catch"](function (error) {
                $videoMedia.muted = true;
                $videoMedia.play();
              });
            }
          };
          $videoMedia.onplaying = function () {
            console.debug("".concat(capitalizeStr(media.mediaType), " for media > ").concat(media.id, " is now playing . . ."));
          };
          if (media.duration === 0) {
            $videoMedia.ondurationchange = function () {
              console.debug('Showing Media ' + media.id + ' for ' + $videoMedia.duration + 's of Region ' + media.region.regionId);
            };
            $videoMedia.onended = function () {
              var _media$emitter;
              console.debug("".concat(capitalizeStr(media.mediaType), " for media > ").concat(media.id, " has ended playing . . ."));
              (_media$emitter = media.emitter) === null || _media$emitter === void 0 || _media$emitter.emit('end', media);
            };
          }
        }
      }
    };
    return videoMediaObject;
  }

  function AudioMedia(media) {
    var audioMediaObject = {
      init: function init() {
        var $audioMedia = document.getElementById(getMediaId(media));
        var $playBtn = null;
        if ($audioMedia) {
          $audioMedia.onloadstart = function () {
            console.debug("".concat(capitalizeStr(media.mediaType), " for media > ").concat(media.id, " has started loading data . . ."));
          };
          $audioMedia.onloadeddata = function () {
            if ($audioMedia.readyState >= 2) {
              console.debug("".concat(capitalizeStr(media.mediaType), " data for media > ").concat(media.id, " has been fully loaded . . ."));
            }
          };
          $audioMedia.oncanplay = function () {
            console.debug("".concat(capitalizeStr(media.mediaType), " for media > ").concat(media.id, " can be played . . ."));
          };
          $audioMedia.onplaying = function () {
            console.debug("".concat(capitalizeStr(media.mediaType), " for media > ").concat(media.id, " is now playing . . ."));
            if ($playBtn !== null) {
              $playBtn.remove();
            }
          };
          var audioPlayPromise = $audioMedia.play();
          if (audioPlayPromise !== undefined) {
            audioPlayPromise.then(function () {
              console.debug('autoplay started . . .');
              // Autoplay restarted
            })["catch"](function (error) {
              if (error.name === 'NotAllowedError') {
                var _$audioMedia$parentNo;
                // Let's show a play audio button
                $playBtn = document.createElement('button');
                $playBtn.classList.add('play-audio-btn');
                $playBtn.textContent = 'Play Audio';
                $playBtn.addEventListener('click', function () {
                  $audioMedia.muted = false;
                  $audioMedia.play();
                });
                (_$audioMedia$parentNo = $audioMedia.parentNode) === null || _$audioMedia$parentNo === void 0 || _$audioMedia$parentNo.insertBefore($playBtn, $audioMedia.nextSibling);
              }
            });
          }
          if (media.duration === 0) {
            $audioMedia.ondurationchange = function () {
              console.debug('Showing Media ' + media.id + ' for ' + $audioMedia.duration + 's of Region ' + media.region.regionId);
            };
            $audioMedia.onended = function () {
              var _media$emitter;
              console.debug("".concat(capitalizeStr(media.mediaType), " for media > ").concat(media.id, " has ended playing . . ."));
              (_media$emitter = media.emitter) === null || _media$emitter === void 0 || _media$emitter.emit('end', media);
            };
          }
        }
      }
    };
    return audioMediaObject;
  }

  function Media(region, mediaId, xml, options, xlr) {
    var props = {
      region: region,
      mediaId: mediaId,
      xml: xml,
      options: options
    };
    var mediaTimer = null;
    var mediaTimeCount = 0;
    var emitter = createNanoEvents();
    var mediaObject = _objectSpread2(_objectSpread2({}, initialMedia), props);
    var startMediaTimer = function startMediaTimer(media) {
      mediaTimer = setInterval(function () {
        mediaTimeCount++;
        if (mediaTimeCount > media.duration) {
          var _media$emitter;
          (_media$emitter = media.emitter) === null || _media$emitter === void 0 || _media$emitter.emit('end', media);
        }
      }, 1000);
      console.debug('Showing Media ' + media.id + ' for ' + media.duration + 's of Region ' + media.region.regionId);
    };
    emitter.on('start', function (media) {
      if (media.mediaType === 'video') {
        VideoMedia(media).init();
        if (media.duration > 0) {
          startMediaTimer(media);
        }
      } else if (media.mediaType === 'audio') {
        AudioMedia(media).init();
        if (media.duration > 0) {
          startMediaTimer(media);
        }
      } else {
        startMediaTimer(media);
      }
    });
    emitter.on('end', function (media) {
      if (mediaTimer) {
        clearInterval(mediaTimer);
        mediaTimeCount = 0;
      }
      media.region.playNextMedia();
    });
    mediaObject.init = function () {
      var _self$xml, _self$xml2, _self$xml3, _self$xml4, _self$xml5;
      var self = mediaObject;
      self.id = props.mediaId;
      self.fileId = ((_self$xml = self.xml) === null || _self$xml === void 0 ? void 0 : _self$xml.getAttribute('fileId')) || '';
      self.idCounter = nextId(props.options);
      self.containerName = "M-".concat(self.id, "-").concat(self.idCounter);
      self.iframeName = "".concat(self.containerName, "-iframe");
      self.mediaType = ((_self$xml2 = self.xml) === null || _self$xml2 === void 0 ? void 0 : _self$xml2.getAttribute('type')) || '';
      self.render = ((_self$xml3 = self.xml) === null || _self$xml3 === void 0 ? void 0 : _self$xml3.getAttribute('render')) || '';
      self.duration = parseInt((_self$xml4 = self.xml) === null || _self$xml4 === void 0 ? void 0 : _self$xml4.getAttribute('duration')) || 0;
      self.options = _objectSpread2(_objectSpread2({}, props.options), {}, {
        mediaId: mediaId
      });
      var $mediaIframe = document.createElement('iframe');
      var mediaOptions = (_self$xml5 = self.xml) === null || _self$xml5 === void 0 ? void 0 : _self$xml5.getElementsByTagName('options');
      if (mediaOptions) {
        for (var _i = 0, _Array$from = Array.from(mediaOptions); _i < _Array$from.length; _i++) {
          var _options = _Array$from[_i];
          // Get options
          var _mediaOptions = _options.children;
          for (var _i2 = 0, _Array$from2 = Array.from(_mediaOptions); _i2 < _Array$from2.length; _i2++) {
            var mediaOption = _Array$from2[_i2];
            self.options[mediaOption.nodeName.toLowerCase()] = mediaOption.textContent;
          }
        }
      }
      // Check for options.uri and add it to media
      if (Boolean(self.options['uri'])) {
        self.uri = self.options['uri'];
      }
      // Show in fullscreen?
      if (self.options.showfullscreen === "1") {
        // Set dimensions as the layout ones
        self.divWidth = self.region.layout.sWidth;
        self.divHeight = self.region.layout.sHeight;
      } else {
        // Set dimensions as the region ones
        self.divWidth = self.region.sWidth;
        self.divHeight = self.region.sHeight;
      }
      $mediaIframe.scrolling = 'no';
      $mediaIframe.id = self.iframeName;
      $mediaIframe.width = "".concat(self.divWidth, "px");
      $mediaIframe.height = "".concat(self.divHeight, "px");
      $mediaIframe.style.cssText = "border: 0; visibility: hidden;";
      var $mediaId = getMediaId(self);
      var $media = document.getElementById($mediaId);
      if ($media === null) {
        if (self.mediaType === 'video') {
          $media = document.createElement('video');
        } else if (self.mediaType === 'audio') {
          $media = new Audio();
        } else {
          $media = document.createElement('div');
        }
        $media.id = $mediaId;
      }
      $media.className = 'media--item';
      /* Scale the Content Container */
      $media.style.cssText = "\n            display: none;\n            width: ".concat(self.divWidth, "px;\n            height: ").concat(self.divHeight, "px;\n            position: absolute;\n            background-size: contain;\n            background-repeat: no-repeat;\n            background-position: center;\n        ");
      document.getElementById("".concat(self.region.containerName));
      var resourceUrlParams = _objectSpread2(_objectSpread2({}, xlr.config.config), {}, {
        regionOptions: self.region.options,
        layoutId: self.region.layout.layoutId,
        regionId: self.region.id,
        mediaId: self.id,
        fileId: self.fileId,
        scaleFactor: self.region.layout.scaleFactor,
        uri: self.uri
      });
      if (self.mediaType === 'image' || self.mediaType === 'video') {
        resourceUrlParams.mediaType = self.mediaType;
      }
      var tmpUrl = composeResourceUrlByPlatform(xlr.config.platform, resourceUrlParams);
      self.url = tmpUrl;
      // Loop if media has loop, or if region has loop and a single media
      self.loop = self.options['loop'] == '1' || self.region.options['loop'] == '1' && self.region.totalMediaObjects == 1;
      $mediaIframe.src = "".concat(tmpUrl, "&width=").concat(self.divWidth, "&height=").concat(self.divHeight);
      if (self.render === 'html' || self.mediaType === 'ticker' || self.mediaType === 'webpage') {
        self.checkIframeStatus = true;
        self.iframe = $mediaIframe;
      } else if (self.mediaType === "image") {
        // preload.addFiles(tmpUrl);
        // $media.style.cssText = $media.style.cssText.concat(`background-image: url('${tmpUrl}');`);
        if (self.options['scaletype'] === 'stretch') {
          $media.style.cssText = $media.style.cssText.concat("background-size: 100% 100%;");
        } else if (self.options['scaletype'] === 'fit') {
          $media.style.cssText = $media.style.cssText.concat("background-size: cover;");
        } else {
          // Center scale type, do we have align or valign?
          var align = self.options['align'] == "" ? "center" : self.options['align'];
          var valign = self.options['valign'] == "" || self.options['valign'] == "middle" ? "center" : self.options['valign'];
          $media.style.cssText = $media.style.cssText.concat("background-position: ".concat(align, " ").concat(valign));
        }
      } else if (self.mediaType === 'video') {
        var $videoMedia = $media;
        $videoMedia.preload = 'auto';
        $videoMedia.textContent = 'Unsupported Video';
        if (Boolean(self.options['mute'])) {
          $videoMedia.muted = self.options.mute === '1';
        }
        if (Boolean(self.options['scaletype'])) {
          if (self.options.scaletype === 'stretch') {
            $videoMedia.style.objectFit = 'fill';
          }
        }
        $videoMedia.playsInline = true;
        if (self.loop) {
          $videoMedia.loop = true;
        }
        $media = $videoMedia;
      } else if (self.mediaType === 'audio') {
        var $audioMedia = $media;
        $audioMedia.preload = 'auto';
        $audioMedia.textContent = 'Unsupported Audio';
        $audioMedia.autoplay = true;
        if (self.loop) {
          $audioMedia.loop = true;
        }
        $media = $audioMedia;
      }
      // Duration is per item condition
      if (self.render === 'html' || self.mediaType === 'ticker') {
        /* Check if the ticker duration is based on the number of items in the feed */
        if (self.options['durationisperitem'] === '1') {
          var regex = new RegExp('<!-- NUMITEMS=(.*?) -->');
          _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
            var html, res;
            return _regeneratorRuntime().wrap(function _callee$(_context) {
              while (1) switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return fetchJSON("".concat(tmpUrl, "&width=").concat(self.divWidth, "&height=").concat(self.divHeight));
                case 2:
                  html = _context.sent;
                  console.debug({
                    html: html
                  });
                  res = regex.exec(html);
                  if (res !== null) {
                    self.duration = parseInt(String(self.duration)) * parseInt(res[1]);
                  }
                case 6:
                case "end":
                  return _context.stop();
              }
            }, _callee);
          }))();
        }
      }
      // Check if the media has fade-in/out transitions
      if (Boolean(self.options['transin']) && Boolean(self.options['transinduration'])) {
        var transInDuration = Number(self.options.transinduration);
        var fadeInTrans = transitionElement('fadeIn', {
          duration: transInDuration
        });
        $media.animate(fadeInTrans.keyframes, fadeInTrans.timing);
      }
      // Add media to the region
      // Second media if exists, will be off-canvas
      // All added media will be hidden by default
      // It will start showing when region.nextMedia() function is called
      // When there's only 1 item and loop = false, don't remove the item but leave it at its last state
      // For image, and only 1 item, it should still have the transition for next state
      // Add conditions for video duration being 0 or 1 and also the loop property
      // For video url, we have to create a URL out of the XLF video URL
      /**
       * @DONE
       * Case 1: Video duration = 0, this will play the video for its entire duration
       * Case 2: Video duration is set > 0 and loop = false
       * E.g. Set duration = 100s, video duration = 62s
       * the video will play until 62s and will stop to its last frame until 100s
       * After 100s, it will expire
       * Case 3: Video duration is set > 0 and loop = true
       * E.g. Set duration = 100s, video duration = 62s, loop = true
       * the video will play until 62s and will loop through until the remaining 38s
       * to complete the 100s set duration
       */
      // Add html node to media for
      self.html = $media;
      // Check/set iframe based widgets play status
    };
    mediaObject.run = function () {
      var self = mediaObject;
      var transInDuration = 1;
      var transInDirection = 'E';
      if (Boolean(self.options['transinduration'])) {
        transInDuration = Number(self.options.transinduration);
      }
      if (Boolean(self.options['transindirection'])) {
        transInDirection = self.options.transindirection;
      }
      var defaultTransInOptions = {
        duration: transInDuration
      };
      var transIn = transitionElement('defaultIn', {
        duration: defaultTransInOptions.duration
      });
      if (Boolean(self.options['transin'])) {
        var transInName = self.options['transin'];
        if (transInName === 'fly') {
          transInName = "".concat(transInName, "In");
          defaultTransInOptions.keyframes = flyTransitionKeyframes({
            trans: 'in',
            direction: transInDirection,
            height: self.divHeight,
            width: self.divWidth
          });
        }
        transIn = transitionElement(transInName, defaultTransInOptions);
      }
      var showCurrentMedia = /*#__PURE__*/function () {
        var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
          var $mediaId, $media, isCMS, _self$emitter;
          return _regeneratorRuntime().wrap(function _callee2$(_context2) {
            while (1) switch (_context2.prev = _context2.next) {
              case 0:
                $mediaId = getMediaId(self);
                $media = document.getElementById($mediaId);
                isCMS = xlr.config.platform === 'CMS';
                if ($media === null) {
                  $media = getNewMedia();
                }
                if (!($media !== null)) {
                  _context2.next = 46;
                  break;
                }
                $media.style.setProperty('display', 'block');
                if (Boolean(self.options['transin'])) {
                  $media.animate(transIn.keyframes, transIn.timing);
                }
                if (!(self.mediaType === 'image' && self.url !== null)) {
                  _context2.next = 22;
                  break;
                }
                _context2.t0 = $media.style;
                _context2.t1 = "url(";
                if (isCMS) {
                  _context2.next = 14;
                  break;
                }
                _context2.t2 = self.url;
                _context2.next = 17;
                break;
              case 14:
                _context2.next = 16;
                return getDataBlob(self.url);
              case 16:
                _context2.t2 = _context2.sent;
              case 17:
                _context2.t3 = _context2.t2;
                _context2.t4 = _context2.t1.concat.call(_context2.t1, _context2.t3);
                _context2.t0.setProperty.call(_context2.t0, 'background-image', _context2.t4);
                _context2.next = 45;
                break;
              case 22:
                if (!(self.mediaType === 'video' && self.url !== null)) {
                  _context2.next = 33;
                  break;
                }
                if (!isCMS) {
                  _context2.next = 29;
                  break;
                }
                _context2.next = 26;
                return preloadMediaBlob(self.url, self.mediaType);
              case 26:
                _context2.t5 = _context2.sent;
                _context2.next = 30;
                break;
              case 29:
                _context2.t5 = self.url;
              case 30:
                $media.src = _context2.t5;
                _context2.next = 45;
                break;
              case 33:
                if (!(self.mediaType === 'audio' && self.url !== null)) {
                  _context2.next = 44;
                  break;
                }
                if (!isCMS) {
                  _context2.next = 40;
                  break;
                }
                _context2.next = 37;
                return preloadMediaBlob(self.url, self.mediaType);
              case 37:
                _context2.t6 = _context2.sent;
                _context2.next = 41;
                break;
              case 40:
                _context2.t6 = self.url;
              case 41:
                $media.src = _context2.t6;
                _context2.next = 45;
                break;
              case 44:
                if ((self.render === 'html' || self.mediaType === 'webpage') && self.iframe && self.checkIframeStatus) {
                  // Set state as false ( for now )
                  self.ready = false;
                  // Append iframe
                  $media.innerHTML = '';
                  $media.appendChild(self.iframe);
                  // On iframe load, set state as ready to play full preview
                  self.iframe && self.iframe.addEventListener('load', function () {
                    self.ready = true;
                    if (self.iframe) {
                      var iframeStyles = self.iframe.style.cssText;
                      self.iframe.style.cssText = iframeStyles === null || iframeStyles === void 0 ? void 0 : iframeStyles.concat('visibility: visible;');
                    }
                  });
                }
              case 45:
                (_self$emitter = self.emitter) === null || _self$emitter === void 0 || _self$emitter.emit('start', self);
              case 46:
              case "end":
                return _context2.stop();
            }
          }, _callee2);
        }));
        return function showCurrentMedia() {
          return _ref2.apply(this, arguments);
        };
      }();
      var getNewMedia = function getNewMedia() {
        var $region = document.getElementById("".concat(self.region.containerName));
        // This function is for checking whether
        // the region still has to show a media item
        // when another region is not finished yet
        if (self.region.complete && !self.region.layout.allEnded) {
          // Add currentMedia to the region
          $region && $region.insertBefore(self.html, $region.lastElementChild);
          return self.html;
        }
        return null;
      };
      showCurrentMedia();
    };
    mediaObject.stop = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
      var self, $media;
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            self = mediaObject;
            $media = document.getElementById(getMediaId(self));
            if ($media) {
              $media.style.display = 'none';
              $media.remove();
            }
          case 3:
          case "end":
            return _context3.stop();
        }
      }, _callee3);
    }));
    mediaObject.on = function (event, callback) {
      return emitter.on(event, callback);
    };
    mediaObject.emitter = emitter;
    mediaObject.init();
    return mediaObject;
  }

  function Region(layout, xml, regionId, options, xlr) {
    var props = {
      layout: layout,
      xml: xml,
      regionId: regionId,
      options: options
    };
    var emitter = createNanoEvents();
    var regionObject = _objectSpread2(_objectSpread2({}, initialRegion), props);
    regionObject.prepareRegion = function () {
      var _self$xml, _self$xml2, _self$xml3, _self$xml4, _self$xml5, _self$xml6;
      var self = regionObject;
      var layout = self.layout,
        options = self.options;
      self.id = props.regionId;
      self.options = _objectSpread2(_objectSpread2({}, platform), props.options);
      self.containerName = "R-".concat(self.id, "-").concat(nextId(self.options));
      self.xml = props.xml;
      self.mediaObjects = [];
      self.sWidth = self.xml && Number((_self$xml = self.xml) === null || _self$xml === void 0 ? void 0 : _self$xml.getAttribute('width')) * layout.scaleFactor;
      self.sHeight = self.xml && Number((_self$xml2 = self.xml) === null || _self$xml2 === void 0 ? void 0 : _self$xml2.getAttribute('height')) * layout.scaleFactor;
      self.offsetX = self.xml && Number((_self$xml3 = self.xml) === null || _self$xml3 === void 0 ? void 0 : _self$xml3.getAttribute('left')) * layout.scaleFactor;
      self.offsetY = self.xml && Number((_self$xml4 = self.xml) === null || _self$xml4 === void 0 ? void 0 : _self$xml4.getAttribute('top')) * layout.scaleFactor;
      self.zIndex = self.xml && Number((_self$xml5 = self.xml) === null || _self$xml5 === void 0 ? void 0 : _self$xml5.getAttribute('zindex'));
      var regionOptions = (_self$xml6 = self.xml) === null || _self$xml6 === void 0 ? void 0 : _self$xml6.getElementsByTagName('options');
      if (regionOptions) {
        for (var _i = 0, _Array$from = Array.from(regionOptions); _i < _Array$from.length; _i++) {
          var _options = _Array$from[_i];
          // Get options
          var _regionOptions = _options.children;
          for (var _i2 = 0, _Array$from2 = Array.from(_regionOptions); _i2 < _Array$from2.length; _i2++) {
            var regionOption = _Array$from2[_i2];
            self.options[regionOption.nodeName.toLowerCase()] = regionOption.textContent;
          }
        }
      }
      var $region = document.getElementById(self.containerName);
      var $layout = document.getElementById("".concat(self.layout.containerName));
      if ($region === null) {
        $region = document.createElement('div');
        $region.id = self.containerName;
      }
      $layout && $layout.appendChild($region);
      /* Scale the Layout Container */
      /* Add region styles */
      $region.style.cssText = "\n            width: ".concat(self.sWidth, "px;\n            height: ").concat(self.sHeight, "px;\n            position: absolute;\n            left: ").concat(self.offsetX, "px;\n            top: ").concat(self.offsetY, "px;\n            z-index: ").concat(Math.round(self.zIndex), ";\n        ");
      $region.className = 'region--item';
      /* Parse region media objects */
      var regionMediaItems = Array.from(self.xml.getElementsByTagName('media'));
      self.totalMediaObjects = regionMediaItems.length;
      Array.from(regionMediaItems).forEach(function (mediaXml, indx) {
        var mediaObj = Media(self, (mediaXml === null || mediaXml === void 0 ? void 0 : mediaXml.getAttribute('id')) || '', mediaXml, options, xlr);
        mediaObj.index = indx;
        self.mediaObjects.push(mediaObj);
      });
      self.prepareMediaObjects();
    };
    regionObject.finished = function () {
      var self = regionObject;
      console.debug('Region::finished called . . . ', self.id);
      // Mark as complete
      self.complete = true;
      self.layout.regions[regionObject.index] = regionObject;
      self.layout.regionExpired();
    };
    regionObject.prepareMediaObjects = function () {
      var self = regionObject;
      var nextMediaIndex;
      if (self.mediaObjects.length > 0) {
        if (self.curMedia) {
          self.oldMedia = self.curMedia;
        } else {
          self.oldMedia = undefined;
        }
        if (self.currentMediaIndex >= self.mediaObjects.length) {
          self.currentMediaIndex = 0;
        }
        self.curMedia = self.mediaObjects[self.currentMediaIndex];
        nextMediaIndex = self.currentMediaIndex + 1;
        if (nextMediaIndex >= self.mediaObjects.length || !Boolean(self.mediaObjects[nextMediaIndex]) && self.mediaObjects.length === 1) {
          nextMediaIndex = 0;
        }
        if (Boolean(self.mediaObjects[nextMediaIndex])) {
          self.nxtMedia = self.mediaObjects[nextMediaIndex];
        }
        var $region = document.getElementById("".concat(self.containerName));
        // Append available media to region DOM
        if (self.curMedia) {
          $region && $region.insertBefore(self.curMedia.html, $region.lastElementChild);
        }
        if (self.nxtMedia) {
          $region && $region.insertBefore(self.nxtMedia.html, $region.lastElementChild);
        }
      }
    };
    regionObject.run = function () {
      console.debug('Called Region::run > ', regionObject.id);
      if (regionObject.curMedia) {
        regionObject.transitionNodes(regionObject.oldMedia, regionObject.curMedia);
      }
    };
    regionObject.transitionNodes = function (oldMedia, newMedia) {
      var self = regionObject;
      var transOutDuration = 1;
      var transOutDirection = 'E';
      if (newMedia) {
        if (oldMedia && Boolean(oldMedia.options['transoutduration'])) {
          transOutDuration = Number(oldMedia.options.transoutduration);
        }
        if (oldMedia && Boolean(oldMedia.options['transoutdirection'])) {
          transOutDirection = oldMedia.options.transoutdirection;
        }
        var defaultTransOutOptions = {
          duration: transOutDuration
        };
        var transOut = transitionElement('defaultOut', {
          duration: defaultTransOutOptions.duration
        });
        var transOutName;
        if (oldMedia && Boolean(oldMedia.options['transout'])) {
          transOutName = oldMedia.options['transout'];
          if (transOutName === 'fly') {
            transOutName = "".concat(transOutName, "Out");
            defaultTransOutOptions.keyframes = flyTransitionKeyframes({
              trans: 'out',
              direction: transOutDirection,
              height: oldMedia.divHeight,
              width: oldMedia.divWidth
            });
          }
          transOut = transitionElement(transOutName, defaultTransOutOptions);
        }
        var hideOldMedia = new Promise(function (resolve) {
          // Hide oldMedia
          if (oldMedia) {
            var $oldMedia = document.getElementById(getMediaId(oldMedia));
            if ($oldMedia) {
              var removeOldMedia = function removeOldMedia() {
                $oldMedia.style.setProperty('display', 'none');
                $oldMedia.remove();
              };
              var oldMediaAnimate;
              if (Boolean(oldMedia.options['transout'])) {
                oldMediaAnimate = $oldMedia.animate(transOut.keyframes, transOut.timing);
              }
              if (Boolean(oldMedia.options['transout']) && self.totalMediaObjects > 1) {
                if (transOutName === 'flyOut') {
                  // Reset last item to original position and state
                  oldMediaAnimate ? oldMediaAnimate.finished.then(function () {
                    var _oldMediaAnimate;
                    resolve(true);
                    (_oldMediaAnimate = oldMediaAnimate) === null || _oldMediaAnimate === void 0 || (_oldMediaAnimate = _oldMediaAnimate.effect) === null || _oldMediaAnimate === void 0 || _oldMediaAnimate.updateTiming({
                      fill: 'none'
                    });
                    removeOldMedia();
                  }) : undefined;
                } else {
                  setTimeout(removeOldMedia, transOutDuration / 2);
                  resolve(true);
                }
              } else {
                removeOldMedia();
                // Resolve this right away
                // As a result, the transition between two media object
                // seems like a cross-over
                resolve(true);
              }
            }
          }
        });
        if (oldMedia) {
          hideOldMedia.then(function (isDone) {
            if (isDone) {
              newMedia.run();
            }
          });
        } else {
          newMedia.run();
        }
      }
    };
    regionObject.playNextMedia = function () {
      var _self$curMedia, _self$curMedia2, _self$curMedia3, _self$curMedia4;
      var self = regionObject;
      /* The current media has finished running */
      if (self.ended) {
        return;
      }
      if (self.currentMediaIndex === self.mediaObjects.length - 1) {
        self.finished();
        if (self.layout.allEnded) {
          return;
        }
      }
      // When the region has completed and when currentMedia is html
      // Then, preserve the currentMedia state
      if (self.complete && ((_self$curMedia = self.curMedia) === null || _self$curMedia === void 0 ? void 0 : _self$curMedia.render) === 'html') {
        return;
      }
      // When the region has completed and mediaObjects.length = 1
      // and curMedia.loop = false, then put the media on
      // its current state
      if (self.complete && self.mediaObjects.length === 1 && ((_self$curMedia2 = self.curMedia) === null || _self$curMedia2 === void 0 ? void 0 : _self$curMedia2.render) !== 'html' && ((_self$curMedia3 = self.curMedia) === null || _self$curMedia3 === void 0 ? void 0 : _self$curMedia3.mediaType) === 'image' && !((_self$curMedia4 = self.curMedia) !== null && _self$curMedia4 !== void 0 && _self$curMedia4.loop)) {
        return;
      }
      self.currentMediaIndex = self.currentMediaIndex + 1;
      self.prepareMediaObjects();
      self.transitionNodes(self.oldMedia, self.curMedia);
    };
    regionObject.end = function () {
      var self = regionObject;
      self.ending = true;
      /* The Layout has finished running */
      /* Do any region exit transition then clean up */
      self.layout.regions[self.index] = self;
      console.debug('Calling Region::end ', self);
      self.exitTransition();
    };
    regionObject.exitTransition = function () {
      var self = regionObject;
      /* TODO: Actually implement region exit transitions */
      var $region = document.getElementById("".concat(self.containerName));
      if ($region) {
        $region.style.display = 'none';
      }
      console.debug('Called Region::exitTransition ', self.id);
      self.exitTransitionComplete();
    };
    regionObject.exitTransitionComplete = function () {
      var self = regionObject;
      console.debug('Called Region::exitTransitionComplete ', self.id);
      self.ended = true;
      self.layout.regions[self.index] = self;
      self.layout.regionEnded();
    };
    regionObject.on = function (event, callback) {
      return emitter.on(event, callback);
    };
    regionObject.emitter = emitter;
    regionObject.prepareRegion();
    return regionObject;
  }

  var playAgainClickHandle = function playAgainClickHandle(ev) {
    ev.preventDefault();
    history.go(0);
  };
  function initRenderingDOM(targetContainer) {
    var _targetContainer = targetContainer;
    var previewPlayer = document.createElement('div');
    var previewScreen = document.createElement('div');
    var endPlay = document.createElement('div');
    var playAgainLink = document.createElement('a');
    // Preview player
    previewPlayer.className = 'player-preview';
    previewPlayer.id = 'player_container';
    // Preview screen
    previewScreen.className = 'screen-preview';
    previewScreen.id = 'screen_container';
    // Ended play
    endPlay.className = 'preview-ended';
    endPlay.id = 'play_ended';
    endPlay.style.display = 'none';
    // Play again link
    playAgainLink.id = 'play_back_preview';
    playAgainLink.className = 'play-back-preview';
    playAgainLink.style.cssText = 'text-decoration: none; color: #ffffff;';
    playAgainLink.innerHTML = 'Play again?';
    playAgainLink.removeEventListener('click', playAgainClickHandle);
    playAgainLink.addEventListener('click', playAgainClickHandle);
    if (!_targetContainer) {
      _targetContainer = document.body;
    }
    if (_targetContainer) {
      if (_targetContainer.querySelector('#player_container') === null) {
        _targetContainer.insertBefore(previewPlayer, _targetContainer.firstChild);
        if (previewPlayer.querySelector('#screen_container') === null) {
          previewPlayer.appendChild(previewScreen);
        }
        if (previewPlayer.querySelector('#play_ended') === null) {
          previewPlayer.appendChild(endPlay);
          if (endPlay.querySelector('a') === null) {
            endPlay.appendChild(playAgainLink);
          }
        }
      }
    }
  }
  function getXlf(_x) {
    return _getXlf.apply(this, arguments);
  }
  function _getXlf() {
    _getXlf = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(layoutOptions) {
      var apiHost, xlfUrl, fetchOptions, res;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            apiHost = window.location.origin;
            xlfUrl = apiHost + layoutOptions.xlfUrl;
            fetchOptions = {};
            if (layoutOptions.platform === 'CMS') {
              xlfUrl = apiHost + layoutOptions.xlfUrl;
              fetchOptions.mode = 'no-cors';
            } else if (layoutOptions.platform === 'chromeOS') {
              xlfUrl = layoutOptions.xlfUrl;
              fetchOptions.mode = 'cors';
              fetchOptions.headers = {
                'Content-Type': 'text/xml'
              };
            } else if (layoutOptions.platform !== 'CMS' && layoutOptions.appHost !== null) {
              xlfUrl = layoutOptions.appHost + layoutOptions.xlfUrl;
            }
            _context2.next = 6;
            return fetch(xlfUrl);
          case 6:
            res = _context2.sent;
            _context2.next = 9;
            return res.text();
          case 9:
            return _context2.abrupt("return", _context2.sent);
          case 10:
          case "end":
            return _context2.stop();
        }
      }, _callee2);
    }));
    return _getXlf.apply(this, arguments);
  }
  function getLayout(params) {
    var _currentLayout = undefined;
    var _nextLayout = undefined;
    var _params$xlr = params.xlr,
      inputLayouts = _params$xlr.inputLayouts,
      currentLayout = _params$xlr.currentLayout,
      nextLayout = _params$xlr.nextLayout,
      currLayoutIndx = _params$xlr.currentLayoutIndex;
    var hasLayout = inputLayouts.length > 0;
    var currentLayoutIndex = currLayoutIndx;
    var nextLayoutIndex = currentLayoutIndex + 1;
    if (currentLayout === undefined && nextLayout === undefined) {
      var activeLayout;
      // Preview just got started
      if (hasLayout) {
        var nextLayoutTemp = _objectSpread2({}, initialLayout);
        activeLayout = inputLayouts[currentLayoutIndex];
        _currentLayout = _objectSpread2(_objectSpread2({}, initialLayout), activeLayout);
        if (inputLayouts.length > 1) {
          nextLayoutTemp = _objectSpread2(_objectSpread2({}, nextLayoutTemp), inputLayouts[nextLayoutIndex]);
          _nextLayout = nextLayoutTemp;
        } else {
          _nextLayout = _currentLayout;
        }
        _currentLayout.id = activeLayout.layoutId;
        if (nextLayoutTemp) {
          _nextLayout.id = nextLayoutTemp.layoutId;
        }
      }
    } else {
      if (hasLayout) {
        var _currentLayout2;
        _currentLayout = nextLayout;
        currentLayoutIndex = getIndexByLayoutId(inputLayouts, (_currentLayout2 = _currentLayout) === null || _currentLayout2 === void 0 ? void 0 : _currentLayout2.layoutId).index;
        nextLayoutIndex = currentLayoutIndex + 1;
        if (inputLayouts.length > 1 && nextLayoutIndex < inputLayouts.length) {
          if (Boolean(params.xlr.layouts[nextLayoutIndex])) {
            _nextLayout = params.xlr.layouts[nextLayoutIndex];
          } else {
            _nextLayout = _objectSpread2(_objectSpread2({}, initialLayout), inputLayouts[nextLayoutIndex]);
          }
        }
        // If _nextLayout is undefined, then we go back to first layout
        if (_nextLayout === undefined) {
          _nextLayout = params.xlr.layouts[0];
        }
      }
    }
    return {
      currentLayoutIndex: currentLayoutIndex,
      inputLayouts: params.xlr.inputLayouts,
      current: _currentLayout,
      next: _nextLayout
    };
  }
  function Layout(data, options, xlr, layout) {
    var props = {
      data: data,
      options: options,
      layout: layout || initialLayout
    };
    var emitter = createNanoEvents();
    emitter.on('start', function (layout) {
      layout.done = false;
      console.debug('Layout start emitted > Layout ID > ', layout.id);
    });
    emitter.on('end', function (layout) {
      console.debug('Ending layout with ID of > ', layout.layoutId);
      layout.done = true;
      /* Remove layout that has ended */
      var $layout = document.getElementById(layout.containerName);
      console.debug({
        $layout: $layout
      });
      if ($layout !== null) {
        $layout.remove();
      }
      if (xlr.config.platform !== 'CMS') {
        // Transition next layout to current layout and prepare next layout if exist
        xlr.prepareLayouts().then(function (parent) {
          xlr.playSchedules(parent);
        });
      }
    });
    var layoutObject = _objectSpread2(_objectSpread2({}, props.layout), {}, {
      options: props.options,
      emitter: emitter
    });
    layoutObject.on = function (event, callback) {
      return emitter.on(event, callback);
    };
    layoutObject.run = function () {
      var layout = layoutObject;
      var $layoutContainer = document.getElementById("".concat(layout.containerName));
      var $splashScreen = document.getElementById("splash_".concat(layout.id));
      if ($layoutContainer) {
        $layoutContainer.style.display = 'block';
      }
      if ($splashScreen) {
        $splashScreen.style.display = 'none';
      }
      console.debug('Layout running > Layout ID > ', layout.id);
      console.debug('Layout Regions > ', layout.regions);
      for (var i = 0; i < layout.regions.length; i++) {
        // playLog(4, "debug", "Running region " + self.regions[i].id, false);
        layout.regions[i].run();
      }
    };
    layoutObject.parseXlf = function () {
      var _layout$layoutNode, _layout$layoutNode2, _layout$layoutNode3, _layout$layoutNode4, _layout$layoutNode5, _layout$layoutNode6;
      var layout = layoutObject;
      var data = props.data,
        options = props.options;
      layout.containerName = "L" + layout.id + "-" + nextId(options);
      layout.regions = [];
      /* Create a hidden div to show the layout in */
      var $layout = document.getElementById(layout.containerName);
      if ($layout === null) {
        $layout = document.createElement('div');
        $layout.id = layout.containerName;
      }
      var $screen = document.getElementById('screen_container');
      $screen && $screen.appendChild($layout);
      if ($layout) {
        $layout.style.display = 'none';
        $layout.style.outline = 'red solid thin';
      }
      layout.layoutNode = data;
      /* Calculate the screen size */
      layout.sw = ($screen === null || $screen === void 0 ? void 0 : $screen.offsetWidth) || 0;
      layout.sh = ($screen === null || $screen === void 0 ? void 0 : $screen.offsetHeight) || 0;
      layout.xw = Number((_layout$layoutNode = layout.layoutNode) === null || _layout$layoutNode === void 0 || (_layout$layoutNode = _layout$layoutNode.firstElementChild) === null || _layout$layoutNode === void 0 ? void 0 : _layout$layoutNode.getAttribute('width'));
      layout.xh = Number((_layout$layoutNode2 = layout.layoutNode) === null || _layout$layoutNode2 === void 0 || (_layout$layoutNode2 = _layout$layoutNode2.firstElementChild) === null || _layout$layoutNode2 === void 0 ? void 0 : _layout$layoutNode2.getAttribute('height'));
      layout.zIndex = Number((_layout$layoutNode3 = layout.layoutNode) === null || _layout$layoutNode3 === void 0 || (_layout$layoutNode3 = _layout$layoutNode3.firstElementChild) === null || _layout$layoutNode3 === void 0 ? void 0 : _layout$layoutNode3.getAttribute('zindex')) || 0;
      /* Calculate Scale Factor */
      layout.scaleFactor = Math.min(layout.sw / layout.xw, layout.sh / layout.xh);
      layout.sWidth = Math.round(layout.xw * layout.scaleFactor);
      layout.sHeight = Math.round(layout.xh * layout.scaleFactor);
      layout.offsetX = Math.abs(layout.sw - layout.sWidth) / 2;
      layout.offsetY = Math.abs(layout.sh - layout.sHeight) / 2;
      /* Scale the Layout Container */
      if ($layout) {
        $layout.style.width = "".concat(layout.sWidth, "px");
        $layout.style.height = "".concat(layout.sHeight, "px");
        $layout.style.position = 'absolute';
        $layout.style.left = "".concat(layout.offsetX, "px");
        $layout.style.top = "".concat(layout.offsetY, "px");
      }
      if ($layout && layout.zIndex !== null) {
        $layout.style.zIndex = "".concat(layout.zIndex);
      }
      /* Set the layout background */
      layout.bgColor = ((_layout$layoutNode4 = layout.layoutNode) === null || _layout$layoutNode4 === void 0 || (_layout$layoutNode4 = _layout$layoutNode4.firstElementChild) === null || _layout$layoutNode4 === void 0 ? void 0 : _layout$layoutNode4.getAttribute('bgcolor')) || '';
      layout.bgImage = ((_layout$layoutNode5 = layout.layoutNode) === null || _layout$layoutNode5 === void 0 || (_layout$layoutNode5 = _layout$layoutNode5.firstElementChild) === null || _layout$layoutNode5 === void 0 ? void 0 : _layout$layoutNode5.getAttribute('background')) || '';
      if (!(layout.bgImage === "" || typeof layout.bgImage === 'undefined')) {
        /* Extract the image ID from the filename */
        layout.bgId = layout.bgImage.substring(0, layout.bgImage.indexOf('.'));
        var bgImageUrl = composeBgUrlByPlatform(xlr.config.platform, _objectSpread2(_objectSpread2({}, options), {}, {
          layout: layout
        }));
        if ($layout) {
          $layout.style.backgroundImage = "url(\"".concat(bgImageUrl, "\")");
          $layout.style.backgroundRepeat = 'no-repeat';
          $layout.style.backgroundSize = "".concat(layout.sWidth, "px ").concat(layout.sHeight, "px");
          $layout.style.backgroundPosition = '0px 0px';
        }
      }
      // Set the background color
      if ($layout && layout.bgColor) {
        $layout.style.backgroundColor = "".concat(layout.bgColor);
      }
      // Hide if layout is not the currentLayout
      if ($layout && xlr.currentLayoutId !== undefined && xlr.currentLayoutId !== layout.id) {
        $layout.style.display = 'none';
      }
      // Create regions
      var layoutRegions = Array.from((layout === null || layout === void 0 || (_layout$layoutNode6 = layout.layoutNode) === null || _layout$layoutNode6 === void 0 ? void 0 : _layout$layoutNode6.getElementsByTagName('region')) || []);
      Array.from(layoutRegions).forEach(function (regionXml, indx) {
        var regionObj = Region(layout, regionXml, (regionXml === null || regionXml === void 0 ? void 0 : regionXml.getAttribute('id')) || '', options, xlr);
        regionObj.index = indx;
        layout.regions.push(regionObj);
      });
    };
    layoutObject.prepareLayout = function () {
      layoutObject.parseXlf();
    };
    layoutObject.regionExpired = function () {
      var self = layoutObject;
      self.allExpired = true;
      var _iterator = _createForOfIteratorHelper(self.regions),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var layoutRegion = _step.value;
          if (!layoutRegion.complete) {
            self.allExpired = false;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      if (self.allExpired) {
        self.end();
      }
    };
    layoutObject.regionEnded = function () {
      var self = layoutObject;
      self.allEnded = true;
      for (var i = 0; i < self.regions.length; i++) {
        if (!self.regions[i].ended) {
          self.allEnded = false;
        }
      }
      if (self.allEnded) {
        self.stopAllMedia().then(function () {
          var _self$emitter;
          console.debug('starting to end layout . . .');
          if (xlr.config.platform === 'CMS') {
            var $end = document.getElementById('play_ended');
            var $preview = document.getElementById('screen_container');
            if ($preview) {
              while ($preview.firstChild) {
                $preview.removeChild($preview.firstChild);
              }
              $preview.style.display = 'none';
            }
            if ($end) {
              $end.style.display = 'block';
            }
          }
          (_self$emitter = self.emitter) === null || _self$emitter === void 0 || _self$emitter.emit('end', self);
        });
      }
    };
    layoutObject.end = function () {
      console.debug('Executing Layout::end and Calling Region::end ', layoutObject);
      /* Ask the layout to gracefully stop running now */
      var _iterator2 = _createForOfIteratorHelper(layoutObject.regions),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var layoutRegion = _step2.value;
          layoutRegion.end();
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    };
    layoutObject.stopAllMedia = function () {
      console.debug('Stopping all media . . .');
      return new Promise( /*#__PURE__*/function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(resolve) {
          var i, region, j, media;
          return _regeneratorRuntime().wrap(function _callee$(_context) {
            while (1) switch (_context.prev = _context.next) {
              case 0:
                i = 0;
              case 1:
                if (!(i < layoutObject.regions.length)) {
                  _context.next = 14;
                  break;
                }
                region = layoutObject.regions[i];
                j = 0;
              case 4:
                if (!(j < region.mediaObjects.length)) {
                  _context.next = 11;
                  break;
                }
                media = region.mediaObjects[j];
                _context.next = 8;
                return media.stop();
              case 8:
                j++;
                _context.next = 4;
                break;
              case 11:
                i++;
                _context.next = 1;
                break;
              case 14:
                resolve();
              case 15:
              case "end":
                return _context.stop();
            }
          }, _callee);
        }));
        return function (_x2) {
          return _ref.apply(this, arguments);
        };
      }());
    };
    layoutObject.prepareLayout();
    return layoutObject;
  }

  var ELayoutType;
  (function (ELayoutType) {
    ELayoutType[ELayoutType["CURRENT"] = 0] = "CURRENT";
    ELayoutType[ELayoutType["NEXT"] = 1] = "NEXT";
  })(ELayoutType || (ELayoutType = {}));
  var initialXlr = {
    inputLayouts: [],
    config: platform,
    layouts: [],
    currentLayoutIndex: 0,
    currentLayoutId: null,
    currentLayout: undefined,
    nextLayout: undefined,
    bootstrap: function bootstrap() {},
    init: function init() {
      return Promise.resolve({});
    },
    playSchedules: function playSchedules() {},
    prepareLayoutXlf: function prepareLayoutXlf(inputLayout) {
      return Promise.resolve({});
    },
    prepareLayouts: function prepareLayouts() {
      return Promise.resolve({});
    }
  };

  function XiboLayoutRenderer(inputLayouts, options) {
    var props = {
      inputLayouts: inputLayouts,
      options: options
    };
    var xlrObject = _objectSpread2(_objectSpread2({}, initialXlr), {}, {
      bootstrap: function bootstrap() {
        // Place to set configurations and initialize required props
        var self = this;
        self.inputLayouts = !Array.isArray(props.inputLayouts) ? [props.inputLayouts] : props.inputLayouts;
        self.config = JSON.parse(JSON.stringify(_objectSpread2(_objectSpread2({}, platform), props.options)));
      },
      init: function init() {
        var _this = this;
        console.log({
          splashScreen: splashScreenDOM()
        });
        return new Promise(function (resolve) {
          var self = _this;
          // Prepare rendering DOM
          var previewCanvas = document.querySelector('.preview-canvas');
          initRenderingDOM(previewCanvas);
          self.prepareLayouts().then(function (xlr) {
            resolve(xlr);
          });
        });
      },
      playSchedules: function playSchedules(xlr) {
        // Check if there's a current layout
        if (xlr.currentLayout !== undefined) {
          var _xlr$currentLayout$em;
          (_xlr$currentLayout$em = xlr.currentLayout.emitter) === null || _xlr$currentLayout$em === void 0 || _xlr$currentLayout$em.emit('start', xlr.currentLayout);
          xlr.currentLayout.run();
        }
      },
      prepareLayoutXlf: function prepareLayoutXlf(inputLayout) {
        var _this2 = this;
        return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
          var self, newOptions, layoutXlf, layoutXlfNode, parser;
          return _regeneratorRuntime().wrap(function _callee$(_context) {
            while (1) switch (_context.prev = _context.next) {
              case 0:
                self = _this2; // Compose layout props first
                newOptions = Object.assign({}, platform);
                newOptions = _objectSpread2(_objectSpread2({}, newOptions), props.options);
                if (self.config.platform === 'CMS' && inputLayout && Boolean(inputLayout.layoutId)) {
                  newOptions.xlfUrl = newOptions.xlfUrl.replace(':layoutId', String(inputLayout.layoutId));
                } else if (self.config.platform === 'chromeOS') {
                  newOptions.xlfUrl = inputLayout.path;
                }
                if (!(inputLayout && inputLayout.layoutNode === null)) {
                  _context.next = 12;
                  break;
                }
                _context.next = 7;
                return getXlf(newOptions);
              case 7:
                layoutXlf = _context.sent;
                parser = new window.DOMParser();
                layoutXlfNode = parser.parseFromString(layoutXlf, 'text/xml');
                _context.next = 13;
                break;
              case 12:
                layoutXlfNode = inputLayout && inputLayout.layoutNode;
              case 13:
                return _context.abrupt("return", new Promise(function (resolve) {
                  var xlrLayoutObj = initialLayout;
                  xlrLayoutObj.id = Number(inputLayout.layoutId);
                  xlrLayoutObj.layoutId = Number(inputLayout.layoutId);
                  xlrLayoutObj.options = newOptions;
                  resolve(Layout(layoutXlfNode, newOptions, self, xlrLayoutObj));
                }));
              case 14:
              case "end":
                return _context.stop();
            }
          }, _callee);
        }))();
      },
      prepareLayouts: function prepareLayouts() {
        var _this3 = this;
        return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
          var _xlrLayouts$current;
          var self, xlrLayouts, layoutsXlf, layouts;
          return _regeneratorRuntime().wrap(function _callee2$(_context2) {
            while (1) switch (_context2.prev = _context2.next) {
              case 0:
                self = _this3; // Get layouts
                xlrLayouts = getLayout({
                  xlr: self
                });
                self.currentLayoutId = (_xlrLayouts$current = xlrLayouts.current) === null || _xlrLayouts$current === void 0 ? void 0 : _xlrLayouts$current.layoutId;
                layoutsXlf = function layoutsXlf() {
                  var _xlrLayouts$current2, _xlrLayouts$next;
                  var xlf = [];
                  xlf.push(xlrLayouts.current);
                  if (((_xlrLayouts$current2 = xlrLayouts.current) === null || _xlrLayouts$current2 === void 0 ? void 0 : _xlrLayouts$current2.layoutId) !== ((_xlrLayouts$next = xlrLayouts.next) === null || _xlrLayouts$next === void 0 ? void 0 : _xlrLayouts$next.layoutId)) {
                    xlf.push(xlrLayouts.next);
                  }
                  return xlf.reduce(function (coll, item) {
                    return [].concat(_toConsumableArray(coll), [self.prepareLayoutXlf(item)]);
                  }, []);
                };
                _context2.next = 6;
                return Promise.all(layoutsXlf());
              case 6:
                layouts = _context2.sent;
                return _context2.abrupt("return", new Promise(function (resolve) {
                  self.layouts = layouts;
                  self.currentLayout = self.layouts[0];
                  if (Boolean(self.layouts[1])) {
                    self.nextLayout = self.layouts[1];
                  } else {
                    // Use current layout as next layout if only one layout is available
                    self.nextLayout = self.layouts[0];
                  }
                  self.currentLayoutIndex = xlrLayouts.currentLayoutIndex;
                  self.layouts[self.currentLayoutIndex] = self.currentLayout;
                  resolve(self);
                }));
              case 8:
              case "end":
                return _context2.stop();
            }
          }, _callee2);
        }))();
      }
    });
    xlrObject.bootstrap();
    return xlrObject;
  }

  return XiboLayoutRenderer;

})();
