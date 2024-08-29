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
  },
  resetLayout: function resetLayout() {
    return Promise.resolve();
  },
  emitter: {},
  index: -1
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
function composeResourceUrlByPlatform(options, params) {
  var resourceUrl = params.regionOptions.getResourceUrl.replace(":regionId", params.regionId).replace(":id", params.mediaId) + '?preview=1&layoutPreview=1';
  if (options.platform === 'chromeOS') {
    var resourceEndpoint = params.cmsUrl + '/chromeOS/resource/';
    if (!params.isGlobalContent && params.isImageOrVideo) {
      resourceUrl = resourceEndpoint + params.fileId + '?saveAs=' + params.uri;
    } else {
      // resourceUrl = composeResourceUrl(options.config, params);
      resourceUrl = params.cmsUrl + resourceUrl;
    }
  } else if (!Boolean(params['mediaType'])) {
    resourceUrl += '&scale_override=' + params.scaleFactor;
  }
  return resourceUrl;
}
function composeResourceUrl(config, params) {
  var schemaVersion = config && config.schemaVersion;
  var hardwareKey = config && config.hardwareKey;
  var serverKey = config && config.cmsKey;
  var cmsUrl = config && config.cmsUrl;
  return cmsUrl + '/pwa/getResource' + '?v=' + schemaVersion + '&serverKey=' + serverKey + '&hardwareKey=' + hardwareKey + '&layoutId=' + params.layoutId + '&regionId=' + params.regionId + '&mediaId=' + params.mediaId;
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
  if (Boolean(layoutIndexes[layoutId])) {
    return layoutIndexes[layoutId];
  }
  // Defaults to 0
  return {
    index: 0
  };
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
  prepareMediaObjects: function prepareMediaObjects() {},
  reset: function reset() {}
};

var initialMedia = {
  region: initialRegion,
  xml: null,
  id: '',
  mediaId: '',
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
  timeoutId: setTimeout(function () {}, 0),
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
  },
  emitter: {}
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
        media.emitter.emit('end', media);
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
  mediaObject.on = function (event, callback) {
    return emitter.on(event, callback);
  };
  mediaObject.emitter = emitter;
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
    self.options = _objectSpread2({}, props.options);
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
      uri: self.uri,
      isGlobalContent: self.mediaType === 'global',
      isImageOrVideo: self.mediaType === 'image' || self.mediaType === 'video'
    });
    if (self.mediaType === 'image' || self.mediaType === 'video') {
      resourceUrlParams.mediaType = self.mediaType;
    }
    var tmpUrl = '';
    if (xlr.config.platform === 'CMS') {
      tmpUrl = composeResourceUrlByPlatform(xlr.config, resourceUrlParams);
    } else if (xlr.config.platform === 'chromeOS') {
      tmpUrl = composeResourceUrl(xlr.config.config, resourceUrlParams);
    }
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
    var self = this;
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
        var $mediaId, $media, isCMS;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              $mediaId = getMediaId(self);
              $media = document.getElementById($mediaId);
              isCMS = xlr.config.platform === 'CMS';
              if (!$media) {
                $media = getNewMedia();
              }
              if (!$media) {
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
              self.emitter.emit('start', self);
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
    self.complete = false;
    self.ending = false;
    self.ended = false;
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
    // Reset region states
    regionObject.reset();
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
    console.debug('region::playNextMedia', self);
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
  regionObject.reset = function () {
    regionObject.ended = false;
    regionObject.complete = false;
    regionObject.ending = false;
    console.debug('Resetting region states', regionObject);
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
  _getXlf = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(layoutOptions) {
    var apiHost, xlfUrl, fetchOptions, res;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
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
          _context4.next = 6;
          return fetch(xlfUrl);
        case 6:
          res = _context4.sent;
          _context4.next = 9;
          return res.text();
        case 9:
          return _context4.abrupt("return", _context4.sent);
        case 10:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
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
  emitter.on('end', /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(layout) {
      var $layout;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            console.debug('Ending layout with ID of > ', layout.layoutId);
            /* Remove layout that has ended */
            $layout = document.getElementById(layout.containerName);
            layout.done = true;
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
          case 6:
          case "end":
            return _context.stop();
        }
      }, _callee);
    }));
    return function (_x2) {
      return _ref.apply(this, arguments);
    };
  }());
  var layoutObject = _objectSpread2(_objectSpread2({}, props.layout), {}, {
    options: props.options
  });
  layoutObject.on = function (event, callback) {
    return emitter.on(event, callback);
  };
  layoutObject.emitter = emitter;
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
  layoutObject.prepareLayout = function () {
    layoutObject.parseXlf();
  };
  layoutObject.parseXlf = function () {
    var _layout$layoutNode, _layout$layoutNode2, _layout$layoutNode3, _layout$layoutNode4, _layout$layoutNode5, _layout$layoutNode6;
    var layout = this;
    var options = layout.options;
    layout.done = false;
    layout.allEnded = false;
    layout.allExpired = false;
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
    layout.layoutNode = props.data;
    /* Calculate the screen size */
    layout.sw = ($screen === null || $screen === void 0 ? void 0 : $screen.offsetWidth) || 0;
    layout.sh = ($screen === null || $screen === void 0 ? void 0 : $screen.offsetHeight) || 0;
    layout.xw = Number((_layout$layoutNode = layout.layoutNode) === null || _layout$layoutNode === void 0 || (_layout$layoutNode = _layout$layoutNode.firstElementChild) === null || _layout$layoutNode === void 0 ? void 0 : _layout$layoutNode.getAttribute('width'));
    layout.xh = Number((_layout$layoutNode2 = layout.layoutNode) === null || _layout$layoutNode2 === void 0 || (_layout$layoutNode2 = _layout$layoutNode2.firstElementChild) === null || _layout$layoutNode2 === void 0 ? void 0 : _layout$layoutNode2.getAttribute('height'));
    layout.zIndex = Number((_layout$layoutNode3 = layout.layoutNode) === null || _layout$layoutNode3 === void 0 || (_layout$layoutNode3 = _layout$layoutNode3.firstElementChild) === null || _layout$layoutNode3 === void 0 ? void 0 : _layout$layoutNode3.getAttribute('zindex')) || 0;
    /* Calculate Scale Factor */
    layout.scaleFactor = Math.min(layout.sw / layout.xw, layout.sh / layout.xh);
    layout.sWidth = layout.xw * layout.scaleFactor;
    layout.sHeight = layout.xh * layout.scaleFactor;
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
      self.stopAllMedia().then( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
        var $end, $preview;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              console.debug('starting to end layout . . .');
              if (xlr.config.platform === 'CMS') {
                $end = document.getElementById('play_ended');
                $preview = document.getElementById('screen_container');
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
              self.emitter.emit('end', self);
            case 3:
            case "end":
              return _context2.stop();
          }
        }, _callee2);
      })));
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
      var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(resolve) {
        var i, region, j, media;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              i = 0;
            case 1:
              if (!(i < layoutObject.regions.length)) {
                _context3.next = 14;
                break;
              }
              region = layoutObject.regions[i];
              j = 0;
            case 4:
              if (!(j < region.mediaObjects.length)) {
                _context3.next = 11;
                break;
              }
              media = region.mediaObjects[j];
              _context3.next = 8;
              return media.stop();
            case 8:
              j++;
              _context3.next = 4;
              break;
            case 11:
              i++;
              _context3.next = 1;
              break;
            case 14:
              resolve();
            case 15:
            case "end":
              return _context3.stop();
          }
        }, _callee3);
      }));
      return function (_x3) {
        return _ref3.apply(this, arguments);
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
  },
  updateLayouts: function updateLayouts(inputLayouts) {},
  updateLoop: function updateLoop(inputLayouts) {}
};

var img$1 = "data:image/png;base64,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";

var img = "data:image/gif;base64,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";

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
function SplashScreen($parent, config) {
  var $previewSplash = document.createElement('div');
  var $previewLoader = document.createElement('div');
  var $previewLoaderCaption = document.createElement('div');
  document.createElement('div');
  var splashScreenObj = {
    init: function init() {
      var _this = this;
      $previewSplash.classList.add('preview-splash');
      // Don't show Xibo logo on CMS Preview
      if (config && config.platform !== 'CMS') {
        $previewSplash.style.setProperty('background-image', "url(".concat(img$1, ")"));
        $previewSplash.style.setProperty('background-size', '200px 120px');
        $previewSplash.style.setProperty('background-position', 'calc(100% - 50px) calc(100% - 30px)');
      }
      $previewSplash.constructor.prototype.hide = function () {
        _this.hide();
      };
      $previewLoader.classList.add('preview-loader');
      $previewLoaderCaption.classList.add('preview-loaderCaption');
      // Show loader bar and text on CMS Preview
      if (config && config.platform === 'CMS') {
        $previewLoader.style.setProperty('background-image', "url(".concat(img, ")"));
        $previewLoaderCaption.innerHTML = '<p>Loading Layout...</p>';
      }
      $previewSplash.insertBefore($previewLoader, $previewSplash.lastElementChild);
      $previewSplash.insertBefore($previewLoaderCaption, null);
      this.hide();
    },
    show: function show() {
      if ($parent) {
        $parent.insertBefore($previewSplash, $parent.firstElementChild);
        $previewSplash.style.setProperty('display', 'block');
      }
    },
    hide: function hide() {
      $previewSplash.style.setProperty('display', 'none');
    }
  };
  splashScreenObj.init();
  return splashScreenObj;
}

function XiboLayoutRenderer(inputLayouts, options) {
  var props = {
    inputLayouts: inputLayouts,
    options: options
  };
  var xlrObject = _objectSpread2({}, initialXlr);
  xlrObject.bootstrap = function () {
    // Place to set configurations and initialize required props
    var self = this;
    self.inputLayouts = !Array.isArray(props.inputLayouts) ? [props.inputLayouts] : props.inputLayouts;
    self.config = JSON.parse(JSON.stringify(_objectSpread2(_objectSpread2({}, platform), props.options)));
    // Prepare rendering DOM
    var previewCanvas = document.querySelector('.preview-canvas');
    initRenderingDOM(previewCanvas);
    // Prepare splash screen
    var splashScreen = SplashScreen(document.querySelector('.player-preview'), self.config);
    splashScreen.show();
  };
  xlrObject.init = function () {
    var _this = this;
    return new Promise(function (resolve) {
      var self = _this;
      // Check if only have splash screen from inputLayouts
      if (self.inputLayouts.length === 1 && self.inputLayouts[0].layoutId === 0) {
        resolve(self);
      } else {
        self.prepareLayouts().then(function (xlr) {
          resolve(xlr);
        });
      }
    });
  };
  xlrObject.playSchedules = function (xlr) {
    // Check if there's a current layout
    if (xlr.currentLayout !== undefined) {
      var $splashScreen = document.querySelector('.preview-splash');
      if ($splashScreen && $splashScreen.style.display === 'block') {
        $splashScreen === null || $splashScreen === void 0 || $splashScreen.hide();
      }
      xlr.currentLayout.emitter.emit('start', xlr.currentLayout);
      xlr.currentLayout.run();
    }
  };
  xlrObject.updateLoop = function (inputLayouts) {
    this.updateLayouts(inputLayouts);
  };
  xlrObject.updateLayouts = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(inputLayouts) {
      var _this2 = this;
      var xlr, _this$currentLayout, _this$nextLayout, currLayoutIndex, nxtLayoutIndex, tempOldNxtLayout, newNxtLayoutIndex, tempNxtLayout, hasOldNxtLayout, oldNxtLayoutIndex, _this$nextLayout2, tempNewNxtLayout;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            /**
             * @TODO
             * Case 1: If currentLayout in inputLayouts and in the same sequence,
             * Then, continue playing currentLayout.
             * Check nextLayout in inputLayouts. If in inputLayouts and same sequence, then don't change.
             * If not in inputLayouts, then replace and prepare nextLayout.
             *
             * Case 2: If currentLayout in inputLayouts but not in the same sequence,
             * Then, replace loop, prepare layouts and start currentLayout
             *
             * Case 3: If currentLayout not in inputLayouts,
             * Then, replace everything and start from first layout in sequence.
             */
            this.inputLayouts = inputLayouts;
            /** Case 1: When currentLayout is not in inputLayouts
             * Then, replace everything and start from first layout
             */
            if (!(inputLayouts.filter(function (inputLayout) {
              var _this2$currentLayout;
              return inputLayout.layoutId === ((_this2$currentLayout = _this2.currentLayout) === null || _this2$currentLayout === void 0 ? void 0 : _this2$currentLayout.layoutId);
            }).length === 0)) {
              _context.next = 8;
              break;
            }
            _context.next = 4;
            return this.prepareLayouts();
          case 4:
            xlr = _context.sent;
            this.playSchedules(xlr);
            _context.next = 37;
            break;
          case 8:
            /** Case 2: When currentLayout is in inputLayouts, then continue playing
             * Also check for nextLayout if in inputLayouts and same sequence, then don't change and continue playing.
             * If not in inputLayouts, then replace and prepare nextLayout.
             */
            // 2.1 We don't have to do anything for currentLayout
            // 2.2 Check for nextLayout
            // Get nextLayout index
            currLayoutIndex = getIndexByLayoutId(inputLayouts, (_this$currentLayout = this.currentLayout) === null || _this$currentLayout === void 0 ? void 0 : _this$currentLayout.layoutId).index;
            nxtLayoutIndex = getIndexByLayoutId(inputLayouts, (_this$nextLayout = this.nextLayout) === null || _this$nextLayout === void 0 ? void 0 : _this$nextLayout.layoutId).index;
            tempOldNxtLayout = this.layouts[nxtLayoutIndex];
            newNxtLayoutIndex = currLayoutIndex + 1;
            if (!(nxtLayoutIndex !== newNxtLayoutIndex)) {
              _context.next = 30;
              break;
            }
            // Delete old nextLayout
            delete this.layouts[nxtLayoutIndex];
            if (!Boolean(this.layouts[newNxtLayoutIndex])) {
              _context.next = 19;
              break;
            }
            this.nextLayout = this.layouts[newNxtLayoutIndex];
            this.layouts[newNxtLayoutIndex] = this.nextLayout;
            _context.next = 28;
            break;
          case 19:
            // Check if newNxtLayoutIndex is still within inputLayouts
            if (newNxtLayoutIndex + 1 > inputLayouts.length) {
              // Goes back to first layout in the sequence
              newNxtLayoutIndex = 0;
            }
            if (!Boolean(inputLayouts[newNxtLayoutIndex])) {
              _context.next = 26;
              break;
            }
            tempNxtLayout = _objectSpread2(_objectSpread2({}, initialLayout), inputLayouts[newNxtLayoutIndex]);
            _context.next = 24;
            return this.prepareLayoutXlf(tempNxtLayout);
          case 24:
            this.nextLayout = _context.sent;
            this.layouts[newNxtLayoutIndex] = this.nextLayout;
          case 26:
            // Move old nextLayout to its index
            hasOldNxtLayout = inputLayouts.filter(function (_layout) {
              return _layout.layoutId === (tempOldNxtLayout === null || tempOldNxtLayout === void 0 ? void 0 : tempOldNxtLayout.layoutId);
            });
            if (hasOldNxtLayout.length === 1) {
              oldNxtLayoutIndex = getIndexByLayoutId(inputLayouts, hasOldNxtLayout[0].layoutId).index;
              this.layouts[oldNxtLayoutIndex] = tempOldNxtLayout;
            }
          case 28:
            _context.next = 37;
            break;
          case 30:
            if (!(inputLayouts[nxtLayoutIndex].layoutId !== ((_this$nextLayout2 = this.nextLayout) === null || _this$nextLayout2 === void 0 ? void 0 : _this$nextLayout2.layoutId))) {
              _context.next = 36;
              break;
            }
            tempNewNxtLayout = _objectSpread2(_objectSpread2({}, initialLayout), inputLayouts[nxtLayoutIndex]);
            _context.next = 34;
            return this.prepareLayoutXlf(tempNewNxtLayout);
          case 34:
            this.nextLayout = _context.sent;
            this.layouts[nxtLayoutIndex] = this.nextLayout;
          case 36:
            // Remove old nextLayout if it's not in inputLayouts
            if (tempOldNxtLayout !== null && tempOldNxtLayout !== void 0 && tempOldNxtLayout.index && Boolean(this.layouts[tempOldNxtLayout === null || tempOldNxtLayout === void 0 ? void 0 : tempOldNxtLayout.index])) {
              if (inputLayouts.filter(function (_layout) {
                return _layout.layoutId === (tempOldNxtLayout === null || tempOldNxtLayout === void 0 ? void 0 : tempOldNxtLayout.layoutId);
              }).length === 0) {
                delete this.layouts[tempOldNxtLayout === null || tempOldNxtLayout === void 0 ? void 0 : tempOldNxtLayout.index];
              }
            }
          case 37:
          case "end":
            return _context.stop();
        }
      }, _callee, this);
    }));
    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }();
  xlrObject.prepareLayouts = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
    var _xlrLayouts$current;
    var self, xlrLayouts, layoutsXlf, layouts;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          self = this; // Get layouts
          xlrLayouts = getLayout({
            xlr: self
          });
          console.log('prepareLayouts::xlrLayouts', xlrLayouts);
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
          _context2.next = 7;
          return Promise.all(layoutsXlf());
        case 7:
          layouts = _context2.sent;
          console.log('prepareLayouts::layouts', layouts);
          console.log('prepareLayouts::xlr>layouts', self.layouts);
          return _context2.abrupt("return", new Promise(function (resolve) {
            layouts.map(function (layoutItem) {
              if (!Boolean(self.layouts[layoutItem.index])) {
                self.layouts[layoutItem.index] = layoutItem;
              }
            });
            self.currentLayoutIndex = xlrLayouts.currentLayoutIndex;
            self.currentLayout = self.layouts[self.currentLayoutIndex];
            if (Boolean(layouts[1])) {
              self.nextLayout = layouts[1];
            } else {
              // Use current layout as next layout if only one layout is available
              self.nextLayout = self.layouts[0];
            }
            self.layouts[self.currentLayoutIndex] = self.currentLayout;
            resolve(self);
          }));
        case 11:
        case "end":
          return _context2.stop();
      }
    }, _callee2, this);
  }));
  xlrObject.prepareLayoutXlf = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(inputLayout) {
      var _this3 = this;
      var self, newOptions, layoutXlf, layoutXlfNode, parser;
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            self = this; // Compose layout props first
            newOptions = Object.assign({}, platform);
            newOptions = _objectSpread2(_objectSpread2({}, newOptions), props.options);
            if (self.config.platform === 'CMS' && inputLayout && Boolean(inputLayout.layoutId)) {
              newOptions.xlfUrl = newOptions.xlfUrl.replace(':layoutId', String(inputLayout.layoutId));
            } else if (self.config.platform === 'chromeOS') {
              newOptions.xlfUrl = inputLayout.path;
            }
            if (!(inputLayout && inputLayout.layoutNode === null)) {
              _context3.next = 12;
              break;
            }
            _context3.next = 7;
            return getXlf(newOptions);
          case 7:
            layoutXlf = _context3.sent;
            parser = new window.DOMParser();
            layoutXlfNode = parser.parseFromString(layoutXlf, 'text/xml');
            _context3.next = 13;
            break;
          case 12:
            layoutXlfNode = inputLayout && inputLayout.layoutNode;
          case 13:
            return _context3.abrupt("return", new Promise(function (resolve) {
              var xlrLayoutObj = initialLayout;
              xlrLayoutObj.id = Number(inputLayout.layoutId);
              xlrLayoutObj.layoutId = Number(inputLayout.layoutId);
              xlrLayoutObj.options = newOptions;
              xlrLayoutObj.index = getIndexByLayoutId(_this3.inputLayouts, xlrLayoutObj.layoutId).index;
              resolve(Layout(layoutXlfNode, newOptions, self, xlrLayoutObj));
            }));
          case 14:
          case "end":
            return _context3.stop();
        }
      }, _callee3, this);
    }));
    return function (_x2) {
      return _ref3.apply(this, arguments);
    };
  }();
  xlrObject.bootstrap();
  return xlrObject;
}

export { ELayoutType, XiboLayoutRenderer as default, initialLayout, initialMedia, initialRegion, initialXlr };
//# sourceMappingURL=xibo-layout-renderer.esm.js.map
