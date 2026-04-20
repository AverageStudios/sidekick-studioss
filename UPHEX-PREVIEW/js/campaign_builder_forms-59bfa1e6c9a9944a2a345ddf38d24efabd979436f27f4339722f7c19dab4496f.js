(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/jquery/dist/jquery.js
  var require_jquery = __commonJS({
    "node_modules/jquery/dist/jquery.js"(exports, module) {
      init_esbuild_jquery_shim();
      (function(global, factory) {
        "use strict";
        if (typeof module === "object" && typeof module.exports === "object") {
          module.exports = global.document ? factory(global, true) : function(w) {
            if (!w.document) {
              throw new Error("jQuery requires a window with a document");
            }
            return factory(w);
          };
        } else {
          factory(global);
        }
      })(typeof window !== "undefined" ? window : exports, function(window2, noGlobal) {
        "use strict";
        var arr = [];
        var getProto = Object.getPrototypeOf;
        var slice = arr.slice;
        var flat = arr.flat ? function(array) {
          return arr.flat.call(array);
        } : function(array) {
          return arr.concat.apply([], array);
        };
        var push = arr.push;
        var indexOf = arr.indexOf;
        var class2type = {};
        var toString = class2type.toString;
        var hasOwn = class2type.hasOwnProperty;
        var fnToString = hasOwn.toString;
        var ObjectFunctionString = fnToString.call(Object);
        var support = {};
        var isFunction = function isFunction2(obj) {
          return typeof obj === "function" && typeof obj.nodeType !== "number" && typeof obj.item !== "function";
        };
        var isWindow = function isWindow2(obj) {
          return obj != null && obj === obj.window;
        };
        var document2 = window2.document;
        var preservedScriptAttributes = {
          type: true,
          src: true,
          nonce: true,
          noModule: true
        };
        function DOMEval(code, node, doc) {
          doc = doc || document2;
          var i, val, script = doc.createElement("script");
          script.text = code;
          if (node) {
            for (i in preservedScriptAttributes) {
              val = node[i] || node.getAttribute && node.getAttribute(i);
              if (val) {
                script.setAttribute(i, val);
              }
            }
          }
          doc.head.appendChild(script).parentNode.removeChild(script);
        }
        function toType(obj) {
          if (obj == null) {
            return obj + "";
          }
          return typeof obj === "object" || typeof obj === "function" ? class2type[toString.call(obj)] || "object" : typeof obj;
        }
        var version = "3.7.1", rhtmlSuffix = /HTML$/i, jQuery2 = function(selector, context) {
          return new jQuery2.fn.init(selector, context);
        };
        jQuery2.fn = jQuery2.prototype = {
          // The current version of jQuery being used
          jquery: version,
          constructor: jQuery2,
          // The default length of a jQuery object is 0
          length: 0,
          toArray: function() {
            return slice.call(this);
          },
          // Get the Nth element in the matched element set OR
          // Get the whole matched element set as a clean array
          get: function(num) {
            if (num == null) {
              return slice.call(this);
            }
            return num < 0 ? this[num + this.length] : this[num];
          },
          // Take an array of elements and push it onto the stack
          // (returning the new matched element set)
          pushStack: function(elems) {
            var ret = jQuery2.merge(this.constructor(), elems);
            ret.prevObject = this;
            return ret;
          },
          // Execute a callback for every element in the matched set.
          each: function(callback) {
            return jQuery2.each(this, callback);
          },
          map: function(callback) {
            return this.pushStack(jQuery2.map(this, function(elem, i) {
              return callback.call(elem, i, elem);
            }));
          },
          slice: function() {
            return this.pushStack(slice.apply(this, arguments));
          },
          first: function() {
            return this.eq(0);
          },
          last: function() {
            return this.eq(-1);
          },
          even: function() {
            return this.pushStack(jQuery2.grep(this, function(_elem, i) {
              return (i + 1) % 2;
            }));
          },
          odd: function() {
            return this.pushStack(jQuery2.grep(this, function(_elem, i) {
              return i % 2;
            }));
          },
          eq: function(i) {
            var len = this.length, j = +i + (i < 0 ? len : 0);
            return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
          },
          end: function() {
            return this.prevObject || this.constructor();
          },
          // For internal use only.
          // Behaves like an Array's method, not like a jQuery method.
          push,
          sort: arr.sort,
          splice: arr.splice
        };
        jQuery2.extend = jQuery2.fn.extend = function() {
          var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = false;
          if (typeof target === "boolean") {
            deep = target;
            target = arguments[i] || {};
            i++;
          }
          if (typeof target !== "object" && !isFunction(target)) {
            target = {};
          }
          if (i === length) {
            target = this;
            i--;
          }
          for (; i < length; i++) {
            if ((options = arguments[i]) != null) {
              for (name in options) {
                copy = options[name];
                if (name === "__proto__" || target === copy) {
                  continue;
                }
                if (deep && copy && (jQuery2.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
                  src = target[name];
                  if (copyIsArray && !Array.isArray(src)) {
                    clone = [];
                  } else if (!copyIsArray && !jQuery2.isPlainObject(src)) {
                    clone = {};
                  } else {
                    clone = src;
                  }
                  copyIsArray = false;
                  target[name] = jQuery2.extend(deep, clone, copy);
                } else if (copy !== void 0) {
                  target[name] = copy;
                }
              }
            }
          }
          return target;
        };
        jQuery2.extend({
          // Unique for each copy of jQuery on the page
          expando: "jQuery" + (version + Math.random()).replace(/\D/g, ""),
          // Assume jQuery is ready without the ready module
          isReady: true,
          error: function(msg) {
            throw new Error(msg);
          },
          noop: function() {
          },
          isPlainObject: function(obj) {
            var proto, Ctor;
            if (!obj || toString.call(obj) !== "[object Object]") {
              return false;
            }
            proto = getProto(obj);
            if (!proto) {
              return true;
            }
            Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
            return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
          },
          isEmptyObject: function(obj) {
            var name;
            for (name in obj) {
              return false;
            }
            return true;
          },
          // Evaluates a script in a provided context; falls back to the global one
          // if not specified.
          globalEval: function(code, options, doc) {
            DOMEval(code, { nonce: options && options.nonce }, doc);
          },
          each: function(obj, callback) {
            var length, i = 0;
            if (isArrayLike(obj)) {
              length = obj.length;
              for (; i < length; i++) {
                if (callback.call(obj[i], i, obj[i]) === false) {
                  break;
                }
              }
            } else {
              for (i in obj) {
                if (callback.call(obj[i], i, obj[i]) === false) {
                  break;
                }
              }
            }
            return obj;
          },
          // Retrieve the text value of an array of DOM nodes
          text: function(elem) {
            var node, ret = "", i = 0, nodeType = elem.nodeType;
            if (!nodeType) {
              while (node = elem[i++]) {
                ret += jQuery2.text(node);
              }
            }
            if (nodeType === 1 || nodeType === 11) {
              return elem.textContent;
            }
            if (nodeType === 9) {
              return elem.documentElement.textContent;
            }
            if (nodeType === 3 || nodeType === 4) {
              return elem.nodeValue;
            }
            return ret;
          },
          // results is for internal usage only
          makeArray: function(arr2, results) {
            var ret = results || [];
            if (arr2 != null) {
              if (isArrayLike(Object(arr2))) {
                jQuery2.merge(
                  ret,
                  typeof arr2 === "string" ? [arr2] : arr2
                );
              } else {
                push.call(ret, arr2);
              }
            }
            return ret;
          },
          inArray: function(elem, arr2, i) {
            return arr2 == null ? -1 : indexOf.call(arr2, elem, i);
          },
          isXMLDoc: function(elem) {
            var namespace = elem && elem.namespaceURI, docElem = elem && (elem.ownerDocument || elem).documentElement;
            return !rhtmlSuffix.test(namespace || docElem && docElem.nodeName || "HTML");
          },
          // Support: Android <=4.0 only, PhantomJS 1 only
          // push.apply(_, arraylike) throws on ancient WebKit
          merge: function(first, second) {
            var len = +second.length, j = 0, i = first.length;
            for (; j < len; j++) {
              first[i++] = second[j];
            }
            first.length = i;
            return first;
          },
          grep: function(elems, callback, invert) {
            var callbackInverse, matches = [], i = 0, length = elems.length, callbackExpect = !invert;
            for (; i < length; i++) {
              callbackInverse = !callback(elems[i], i);
              if (callbackInverse !== callbackExpect) {
                matches.push(elems[i]);
              }
            }
            return matches;
          },
          // arg is for internal usage only
          map: function(elems, callback, arg) {
            var length, value, i = 0, ret = [];
            if (isArrayLike(elems)) {
              length = elems.length;
              for (; i < length; i++) {
                value = callback(elems[i], i, arg);
                if (value != null) {
                  ret.push(value);
                }
              }
            } else {
              for (i in elems) {
                value = callback(elems[i], i, arg);
                if (value != null) {
                  ret.push(value);
                }
              }
            }
            return flat(ret);
          },
          // A global GUID counter for objects
          guid: 1,
          // jQuery.support is not used in Core but other projects attach their
          // properties to it so it needs to exist.
          support
        });
        if (typeof Symbol === "function") {
          jQuery2.fn[Symbol.iterator] = arr[Symbol.iterator];
        }
        jQuery2.each(
          "Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),
          function(_i, name) {
            class2type["[object " + name + "]"] = name.toLowerCase();
          }
        );
        function isArrayLike(obj) {
          var length = !!obj && "length" in obj && obj.length, type = toType(obj);
          if (isFunction(obj) || isWindow(obj)) {
            return false;
          }
          return type === "array" || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;
        }
        function nodeName(elem, name) {
          return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
        }
        var pop = arr.pop;
        var sort = arr.sort;
        var splice = arr.splice;
        var whitespace = "[\\x20\\t\\r\\n\\f]";
        var rtrimCSS = new RegExp(
          "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$",
          "g"
        );
        jQuery2.contains = function(a, b) {
          var bup = b && b.parentNode;
          return a === bup || !!(bup && bup.nodeType === 1 && // Support: IE 9 - 11+
          // IE doesn't have `contains` on SVG.
          (a.contains ? a.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
        };
        var rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;
        function fcssescape(ch, asCodePoint) {
          if (asCodePoint) {
            if (ch === "\0") {
              return "\uFFFD";
            }
            return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " ";
          }
          return "\\" + ch;
        }
        jQuery2.escapeSelector = function(sel) {
          return (sel + "").replace(rcssescape, fcssescape);
        };
        var preferredDoc = document2, pushNative = push;
        (function() {
          var i, Expr, outermostContext, sortInput, hasDuplicate, push2 = pushNative, document3, documentElement2, documentIsHTML, rbuggyQSA, matches, expando = jQuery2.expando, dirruns = 0, done = 0, classCache = createCache(), tokenCache = createCache(), compilerCache = createCache(), nonnativeSelectorCache = createCache(), sortOrder = function(a, b) {
            if (a === b) {
              hasDuplicate = true;
            }
            return 0;
          }, booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", identifier = "(?:\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+", attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace + // Operator (capture 2)
          "*([*^$|!~]?=)" + whitespace + // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
          `*(?:'((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)"|(` + identifier + "))|)" + whitespace + "*\\]", pseudos = ":(" + identifier + `)(?:\\((('((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)")|((?:\\\\.|[^\\\\()[\\]]|` + attributes + ")*)|.*)\\)|)", rwhitespace = new RegExp(whitespace + "+", "g"), rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"), rleadingCombinator = new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"), rdescend = new RegExp(whitespace + "|>"), rpseudo = new RegExp(pseudos), ridentifier = new RegExp("^" + identifier + "$"), matchExpr = {
            ID: new RegExp("^#(" + identifier + ")"),
            CLASS: new RegExp("^\\.(" + identifier + ")"),
            TAG: new RegExp("^(" + identifier + "|[*])"),
            ATTR: new RegExp("^" + attributes),
            PSEUDO: new RegExp("^" + pseudos),
            CHILD: new RegExp(
              "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)",
              "i"
            ),
            bool: new RegExp("^(?:" + booleans + ")$", "i"),
            // For use in libraries implementing .is()
            // We use this for POS matching in `select`
            needsContext: new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
          }, rinputs = /^(?:input|select|textarea|button)$/i, rheader = /^h\d$/i, rquickExpr2 = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, rsibling = /[+~]/, runescape = new RegExp("\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\([^\\r\\n\\f])", "g"), funescape = function(escape, nonHex) {
            var high = "0x" + escape.slice(1) - 65536;
            if (nonHex) {
              return nonHex;
            }
            return high < 0 ? String.fromCharCode(high + 65536) : String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320);
          }, unloadHandler = function() {
            setDocument();
          }, inDisabledFieldset = addCombinator(
            function(elem) {
              return elem.disabled === true && nodeName(elem, "fieldset");
            },
            { dir: "parentNode", next: "legend" }
          );
          function safeActiveElement() {
            try {
              return document3.activeElement;
            } catch (err) {
            }
          }
          try {
            push2.apply(
              arr = slice.call(preferredDoc.childNodes),
              preferredDoc.childNodes
            );
            arr[preferredDoc.childNodes.length].nodeType;
          } catch (e) {
            push2 = {
              apply: function(target, els) {
                pushNative.apply(target, slice.call(els));
              },
              call: function(target) {
                pushNative.apply(target, slice.call(arguments, 1));
              }
            };
          }
          function find(selector, context, results, seed) {
            var m, i2, elem, nid, match, groups, newSelector, newContext = context && context.ownerDocument, nodeType = context ? context.nodeType : 9;
            results = results || [];
            if (typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {
              return results;
            }
            if (!seed) {
              setDocument(context);
              context = context || document3;
              if (documentIsHTML) {
                if (nodeType !== 11 && (match = rquickExpr2.exec(selector))) {
                  if (m = match[1]) {
                    if (nodeType === 9) {
                      if (elem = context.getElementById(m)) {
                        if (elem.id === m) {
                          push2.call(results, elem);
                          return results;
                        }
                      } else {
                        return results;
                      }
                    } else {
                      if (newContext && (elem = newContext.getElementById(m)) && find.contains(context, elem) && elem.id === m) {
                        push2.call(results, elem);
                        return results;
                      }
                    }
                  } else if (match[2]) {
                    push2.apply(results, context.getElementsByTagName(selector));
                    return results;
                  } else if ((m = match[3]) && context.getElementsByClassName) {
                    push2.apply(results, context.getElementsByClassName(m));
                    return results;
                  }
                }
                if (!nonnativeSelectorCache[selector + " "] && (!rbuggyQSA || !rbuggyQSA.test(selector))) {
                  newSelector = selector;
                  newContext = context;
                  if (nodeType === 1 && (rdescend.test(selector) || rleadingCombinator.test(selector))) {
                    newContext = rsibling.test(selector) && testContext(context.parentNode) || context;
                    if (newContext != context || !support.scope) {
                      if (nid = context.getAttribute("id")) {
                        nid = jQuery2.escapeSelector(nid);
                      } else {
                        context.setAttribute("id", nid = expando);
                      }
                    }
                    groups = tokenize(selector);
                    i2 = groups.length;
                    while (i2--) {
                      groups[i2] = (nid ? "#" + nid : ":scope") + " " + toSelector(groups[i2]);
                    }
                    newSelector = groups.join(",");
                  }
                  try {
                    push2.apply(
                      results,
                      newContext.querySelectorAll(newSelector)
                    );
                    return results;
                  } catch (qsaError) {
                    nonnativeSelectorCache(selector, true);
                  } finally {
                    if (nid === expando) {
                      context.removeAttribute("id");
                    }
                  }
                }
              }
            }
            return select(selector.replace(rtrimCSS, "$1"), context, results, seed);
          }
          function createCache() {
            var keys = [];
            function cache(key, value) {
              if (keys.push(key + " ") > Expr.cacheLength) {
                delete cache[keys.shift()];
              }
              return cache[key + " "] = value;
            }
            return cache;
          }
          function markFunction(fn) {
            fn[expando] = true;
            return fn;
          }
          function assert(fn) {
            var el = document3.createElement("fieldset");
            try {
              return !!fn(el);
            } catch (e) {
              return false;
            } finally {
              if (el.parentNode) {
                el.parentNode.removeChild(el);
              }
              el = null;
            }
          }
          function createInputPseudo(type) {
            return function(elem) {
              return nodeName(elem, "input") && elem.type === type;
            };
          }
          function createButtonPseudo(type) {
            return function(elem) {
              return (nodeName(elem, "input") || nodeName(elem, "button")) && elem.type === type;
            };
          }
          function createDisabledPseudo(disabled) {
            return function(elem) {
              if ("form" in elem) {
                if (elem.parentNode && elem.disabled === false) {
                  if ("label" in elem) {
                    if ("label" in elem.parentNode) {
                      return elem.parentNode.disabled === disabled;
                    } else {
                      return elem.disabled === disabled;
                    }
                  }
                  return elem.isDisabled === disabled || // Where there is no isDisabled, check manually
                  elem.isDisabled !== !disabled && inDisabledFieldset(elem) === disabled;
                }
                return elem.disabled === disabled;
              } else if ("label" in elem) {
                return elem.disabled === disabled;
              }
              return false;
            };
          }
          function createPositionalPseudo(fn) {
            return markFunction(function(argument) {
              argument = +argument;
              return markFunction(function(seed, matches2) {
                var j, matchIndexes = fn([], seed.length, argument), i2 = matchIndexes.length;
                while (i2--) {
                  if (seed[j = matchIndexes[i2]]) {
                    seed[j] = !(matches2[j] = seed[j]);
                  }
                }
              });
            });
          }
          function testContext(context) {
            return context && typeof context.getElementsByTagName !== "undefined" && context;
          }
          function setDocument(node) {
            var subWindow, doc = node ? node.ownerDocument || node : preferredDoc;
            if (doc == document3 || doc.nodeType !== 9 || !doc.documentElement) {
              return document3;
            }
            document3 = doc;
            documentElement2 = document3.documentElement;
            documentIsHTML = !jQuery2.isXMLDoc(document3);
            matches = documentElement2.matches || documentElement2.webkitMatchesSelector || documentElement2.msMatchesSelector;
            if (documentElement2.msMatchesSelector && // Support: IE 11+, Edge 17 - 18+
            // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
            // two documents; shallow comparisons work.
            // eslint-disable-next-line eqeqeq
            preferredDoc != document3 && (subWindow = document3.defaultView) && subWindow.top !== subWindow) {
              subWindow.addEventListener("unload", unloadHandler);
            }
            support.getById = assert(function(el) {
              documentElement2.appendChild(el).id = jQuery2.expando;
              return !document3.getElementsByName || !document3.getElementsByName(jQuery2.expando).length;
            });
            support.disconnectedMatch = assert(function(el) {
              return matches.call(el, "*");
            });
            support.scope = assert(function() {
              return document3.querySelectorAll(":scope");
            });
            support.cssHas = assert(function() {
              try {
                document3.querySelector(":has(*,:jqfake)");
                return false;
              } catch (e) {
                return true;
              }
            });
            if (support.getById) {
              Expr.filter.ID = function(id) {
                var attrId = id.replace(runescape, funescape);
                return function(elem) {
                  return elem.getAttribute("id") === attrId;
                };
              };
              Expr.find.ID = function(id, context) {
                if (typeof context.getElementById !== "undefined" && documentIsHTML) {
                  var elem = context.getElementById(id);
                  return elem ? [elem] : [];
                }
              };
            } else {
              Expr.filter.ID = function(id) {
                var attrId = id.replace(runescape, funescape);
                return function(elem) {
                  var node2 = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
                  return node2 && node2.value === attrId;
                };
              };
              Expr.find.ID = function(id, context) {
                if (typeof context.getElementById !== "undefined" && documentIsHTML) {
                  var node2, i2, elems, elem = context.getElementById(id);
                  if (elem) {
                    node2 = elem.getAttributeNode("id");
                    if (node2 && node2.value === id) {
                      return [elem];
                    }
                    elems = context.getElementsByName(id);
                    i2 = 0;
                    while (elem = elems[i2++]) {
                      node2 = elem.getAttributeNode("id");
                      if (node2 && node2.value === id) {
                        return [elem];
                      }
                    }
                  }
                  return [];
                }
              };
            }
            Expr.find.TAG = function(tag, context) {
              if (typeof context.getElementsByTagName !== "undefined") {
                return context.getElementsByTagName(tag);
              } else {
                return context.querySelectorAll(tag);
              }
            };
            Expr.find.CLASS = function(className, context) {
              if (typeof context.getElementsByClassName !== "undefined" && documentIsHTML) {
                return context.getElementsByClassName(className);
              }
            };
            rbuggyQSA = [];
            assert(function(el) {
              var input;
              documentElement2.appendChild(el).innerHTML = "<a id='" + expando + "' href='' disabled='disabled'></a><select id='" + expando + "-\r\\' disabled='disabled'><option selected=''></option></select>";
              if (!el.querySelectorAll("[selected]").length) {
                rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");
              }
              if (!el.querySelectorAll("[id~=" + expando + "-]").length) {
                rbuggyQSA.push("~=");
              }
              if (!el.querySelectorAll("a#" + expando + "+*").length) {
                rbuggyQSA.push(".#.+[+~]");
              }
              if (!el.querySelectorAll(":checked").length) {
                rbuggyQSA.push(":checked");
              }
              input = document3.createElement("input");
              input.setAttribute("type", "hidden");
              el.appendChild(input).setAttribute("name", "D");
              documentElement2.appendChild(el).disabled = true;
              if (el.querySelectorAll(":disabled").length !== 2) {
                rbuggyQSA.push(":enabled", ":disabled");
              }
              input = document3.createElement("input");
              input.setAttribute("name", "");
              el.appendChild(input);
              if (!el.querySelectorAll("[name='']").length) {
                rbuggyQSA.push("\\[" + whitespace + "*name" + whitespace + "*=" + whitespace + `*(?:''|"")`);
              }
            });
            if (!support.cssHas) {
              rbuggyQSA.push(":has");
            }
            rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));
            sortOrder = function(a, b) {
              if (a === b) {
                hasDuplicate = true;
                return 0;
              }
              var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
              if (compare) {
                return compare;
              }
              compare = (a.ownerDocument || a) == (b.ownerDocument || b) ? a.compareDocumentPosition(b) : (
                // Otherwise we know they are disconnected
                1
              );
              if (compare & 1 || !support.sortDetached && b.compareDocumentPosition(a) === compare) {
                if (a === document3 || a.ownerDocument == preferredDoc && find.contains(preferredDoc, a)) {
                  return -1;
                }
                if (b === document3 || b.ownerDocument == preferredDoc && find.contains(preferredDoc, b)) {
                  return 1;
                }
                return sortInput ? indexOf.call(sortInput, a) - indexOf.call(sortInput, b) : 0;
              }
              return compare & 4 ? -1 : 1;
            };
            return document3;
          }
          find.matches = function(expr, elements) {
            return find(expr, null, null, elements);
          };
          find.matchesSelector = function(elem, expr) {
            setDocument(elem);
            if (documentIsHTML && !nonnativeSelectorCache[expr + " "] && (!rbuggyQSA || !rbuggyQSA.test(expr))) {
              try {
                var ret = matches.call(elem, expr);
                if (ret || support.disconnectedMatch || // As well, disconnected nodes are said to be in a document
                // fragment in IE 9
                elem.document && elem.document.nodeType !== 11) {
                  return ret;
                }
              } catch (e) {
                nonnativeSelectorCache(expr, true);
              }
            }
            return find(expr, document3, null, [elem]).length > 0;
          };
          find.contains = function(context, elem) {
            if ((context.ownerDocument || context) != document3) {
              setDocument(context);
            }
            return jQuery2.contains(context, elem);
          };
          find.attr = function(elem, name) {
            if ((elem.ownerDocument || elem) != document3) {
              setDocument(elem);
            }
            var fn = Expr.attrHandle[name.toLowerCase()], val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn(elem, name, !documentIsHTML) : void 0;
            if (val !== void 0) {
              return val;
            }
            return elem.getAttribute(name);
          };
          find.error = function(msg) {
            throw new Error("Syntax error, unrecognized expression: " + msg);
          };
          jQuery2.uniqueSort = function(results) {
            var elem, duplicates = [], j = 0, i2 = 0;
            hasDuplicate = !support.sortStable;
            sortInput = !support.sortStable && slice.call(results, 0);
            sort.call(results, sortOrder);
            if (hasDuplicate) {
              while (elem = results[i2++]) {
                if (elem === results[i2]) {
                  j = duplicates.push(i2);
                }
              }
              while (j--) {
                splice.call(results, duplicates[j], 1);
              }
            }
            sortInput = null;
            return results;
          };
          jQuery2.fn.uniqueSort = function() {
            return this.pushStack(jQuery2.uniqueSort(slice.apply(this)));
          };
          Expr = jQuery2.expr = {
            // Can be adjusted by the user
            cacheLength: 50,
            createPseudo: markFunction,
            match: matchExpr,
            attrHandle: {},
            find: {},
            relative: {
              ">": { dir: "parentNode", first: true },
              " ": { dir: "parentNode" },
              "+": { dir: "previousSibling", first: true },
              "~": { dir: "previousSibling" }
            },
            preFilter: {
              ATTR: function(match) {
                match[1] = match[1].replace(runescape, funescape);
                match[3] = (match[3] || match[4] || match[5] || "").replace(runescape, funescape);
                if (match[2] === "~=") {
                  match[3] = " " + match[3] + " ";
                }
                return match.slice(0, 4);
              },
              CHILD: function(match) {
                match[1] = match[1].toLowerCase();
                if (match[1].slice(0, 3) === "nth") {
                  if (!match[3]) {
                    find.error(match[0]);
                  }
                  match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === "even" || match[3] === "odd"));
                  match[5] = +(match[7] + match[8] || match[3] === "odd");
                } else if (match[3]) {
                  find.error(match[0]);
                }
                return match;
              },
              PSEUDO: function(match) {
                var excess, unquoted = !match[6] && match[2];
                if (matchExpr.CHILD.test(match[0])) {
                  return null;
                }
                if (match[3]) {
                  match[2] = match[4] || match[5] || "";
                } else if (unquoted && rpseudo.test(unquoted) && // Get excess from tokenize (recursively)
                (excess = tokenize(unquoted, true)) && // advance to the next closing parenthesis
                (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)) {
                  match[0] = match[0].slice(0, excess);
                  match[2] = unquoted.slice(0, excess);
                }
                return match.slice(0, 3);
              }
            },
            filter: {
              TAG: function(nodeNameSelector) {
                var expectedNodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
                return nodeNameSelector === "*" ? function() {
                  return true;
                } : function(elem) {
                  return nodeName(elem, expectedNodeName);
                };
              },
              CLASS: function(className) {
                var pattern = classCache[className + " "];
                return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function(elem) {
                  return pattern.test(
                    typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || ""
                  );
                });
              },
              ATTR: function(name, operator, check) {
                return function(elem) {
                  var result = find.attr(elem, name);
                  if (result == null) {
                    return operator === "!=";
                  }
                  if (!operator) {
                    return true;
                  }
                  result += "";
                  if (operator === "=") {
                    return result === check;
                  }
                  if (operator === "!=") {
                    return result !== check;
                  }
                  if (operator === "^=") {
                    return check && result.indexOf(check) === 0;
                  }
                  if (operator === "*=") {
                    return check && result.indexOf(check) > -1;
                  }
                  if (operator === "$=") {
                    return check && result.slice(-check.length) === check;
                  }
                  if (operator === "~=") {
                    return (" " + result.replace(rwhitespace, " ") + " ").indexOf(check) > -1;
                  }
                  if (operator === "|=") {
                    return result === check || result.slice(0, check.length + 1) === check + "-";
                  }
                  return false;
                };
              },
              CHILD: function(type, what, _argument, first, last) {
                var simple = type.slice(0, 3) !== "nth", forward = type.slice(-4) !== "last", ofType = what === "of-type";
                return first === 1 && last === 0 ? (
                  // Shortcut for :nth-*(n)
                  function(elem) {
                    return !!elem.parentNode;
                  }
                ) : function(elem, _context, xml) {
                  var cache, outerCache, node, nodeIndex, start, dir2 = simple !== forward ? "nextSibling" : "previousSibling", parent = elem.parentNode, name = ofType && elem.nodeName.toLowerCase(), useCache = !xml && !ofType, diff = false;
                  if (parent) {
                    if (simple) {
                      while (dir2) {
                        node = elem;
                        while (node = node[dir2]) {
                          if (ofType ? nodeName(node, name) : node.nodeType === 1) {
                            return false;
                          }
                        }
                        start = dir2 = type === "only" && !start && "nextSibling";
                      }
                      return true;
                    }
                    start = [forward ? parent.firstChild : parent.lastChild];
                    if (forward && useCache) {
                      outerCache = parent[expando] || (parent[expando] = {});
                      cache = outerCache[type] || [];
                      nodeIndex = cache[0] === dirruns && cache[1];
                      diff = nodeIndex && cache[2];
                      node = nodeIndex && parent.childNodes[nodeIndex];
                      while (node = ++nodeIndex && node && node[dir2] || // Fallback to seeking `elem` from the start
                      (diff = nodeIndex = 0) || start.pop()) {
                        if (node.nodeType === 1 && ++diff && node === elem) {
                          outerCache[type] = [dirruns, nodeIndex, diff];
                          break;
                        }
                      }
                    } else {
                      if (useCache) {
                        outerCache = elem[expando] || (elem[expando] = {});
                        cache = outerCache[type] || [];
                        nodeIndex = cache[0] === dirruns && cache[1];
                        diff = nodeIndex;
                      }
                      if (diff === false) {
                        while (node = ++nodeIndex && node && node[dir2] || (diff = nodeIndex = 0) || start.pop()) {
                          if ((ofType ? nodeName(node, name) : node.nodeType === 1) && ++diff) {
                            if (useCache) {
                              outerCache = node[expando] || (node[expando] = {});
                              outerCache[type] = [dirruns, diff];
                            }
                            if (node === elem) {
                              break;
                            }
                          }
                        }
                      }
                    }
                    diff -= last;
                    return diff === first || diff % first === 0 && diff / first >= 0;
                  }
                };
              },
              PSEUDO: function(pseudo, argument) {
                var args, fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || find.error("unsupported pseudo: " + pseudo);
                if (fn[expando]) {
                  return fn(argument);
                }
                if (fn.length > 1) {
                  args = [pseudo, pseudo, "", argument];
                  return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function(seed, matches2) {
                    var idx, matched = fn(seed, argument), i2 = matched.length;
                    while (i2--) {
                      idx = indexOf.call(seed, matched[i2]);
                      seed[idx] = !(matches2[idx] = matched[i2]);
                    }
                  }) : function(elem) {
                    return fn(elem, 0, args);
                  };
                }
                return fn;
              }
            },
            pseudos: {
              // Potentially complex pseudos
              not: markFunction(function(selector) {
                var input = [], results = [], matcher = compile(selector.replace(rtrimCSS, "$1"));
                return matcher[expando] ? markFunction(function(seed, matches2, _context, xml) {
                  var elem, unmatched = matcher(seed, null, xml, []), i2 = seed.length;
                  while (i2--) {
                    if (elem = unmatched[i2]) {
                      seed[i2] = !(matches2[i2] = elem);
                    }
                  }
                }) : function(elem, _context, xml) {
                  input[0] = elem;
                  matcher(input, null, xml, results);
                  input[0] = null;
                  return !results.pop();
                };
              }),
              has: markFunction(function(selector) {
                return function(elem) {
                  return find(selector, elem).length > 0;
                };
              }),
              contains: markFunction(function(text) {
                text = text.replace(runescape, funescape);
                return function(elem) {
                  return (elem.textContent || jQuery2.text(elem)).indexOf(text) > -1;
                };
              }),
              // "Whether an element is represented by a :lang() selector
              // is based solely on the element's language value
              // being equal to the identifier C,
              // or beginning with the identifier C immediately followed by "-".
              // The matching of C against the element's language value is performed case-insensitively.
              // The identifier C does not have to be a valid language name."
              // https://www.w3.org/TR/selectors/#lang-pseudo
              lang: markFunction(function(lang) {
                if (!ridentifier.test(lang || "")) {
                  find.error("unsupported lang: " + lang);
                }
                lang = lang.replace(runescape, funescape).toLowerCase();
                return function(elem) {
                  var elemLang;
                  do {
                    if (elemLang = documentIsHTML ? elem.lang : elem.getAttribute("xml:lang") || elem.getAttribute("lang")) {
                      elemLang = elemLang.toLowerCase();
                      return elemLang === lang || elemLang.indexOf(lang + "-") === 0;
                    }
                  } while ((elem = elem.parentNode) && elem.nodeType === 1);
                  return false;
                };
              }),
              // Miscellaneous
              target: function(elem) {
                var hash = window2.location && window2.location.hash;
                return hash && hash.slice(1) === elem.id;
              },
              root: function(elem) {
                return elem === documentElement2;
              },
              focus: function(elem) {
                return elem === safeActiveElement() && document3.hasFocus() && !!(elem.type || elem.href || ~elem.tabIndex);
              },
              // Boolean properties
              enabled: createDisabledPseudo(false),
              disabled: createDisabledPseudo(true),
              checked: function(elem) {
                return nodeName(elem, "input") && !!elem.checked || nodeName(elem, "option") && !!elem.selected;
              },
              selected: function(elem) {
                if (elem.parentNode) {
                  elem.parentNode.selectedIndex;
                }
                return elem.selected === true;
              },
              // Contents
              empty: function(elem) {
                for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                  if (elem.nodeType < 6) {
                    return false;
                  }
                }
                return true;
              },
              parent: function(elem) {
                return !Expr.pseudos.empty(elem);
              },
              // Element/input types
              header: function(elem) {
                return rheader.test(elem.nodeName);
              },
              input: function(elem) {
                return rinputs.test(elem.nodeName);
              },
              button: function(elem) {
                return nodeName(elem, "input") && elem.type === "button" || nodeName(elem, "button");
              },
              text: function(elem) {
                var attr;
                return nodeName(elem, "input") && elem.type === "text" && // Support: IE <10 only
                // New HTML5 attribute values (e.g., "search") appear
                // with elem.type === "text"
                ((attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text");
              },
              // Position-in-collection
              first: createPositionalPseudo(function() {
                return [0];
              }),
              last: createPositionalPseudo(function(_matchIndexes, length) {
                return [length - 1];
              }),
              eq: createPositionalPseudo(function(_matchIndexes, length, argument) {
                return [argument < 0 ? argument + length : argument];
              }),
              even: createPositionalPseudo(function(matchIndexes, length) {
                var i2 = 0;
                for (; i2 < length; i2 += 2) {
                  matchIndexes.push(i2);
                }
                return matchIndexes;
              }),
              odd: createPositionalPseudo(function(matchIndexes, length) {
                var i2 = 1;
                for (; i2 < length; i2 += 2) {
                  matchIndexes.push(i2);
                }
                return matchIndexes;
              }),
              lt: createPositionalPseudo(function(matchIndexes, length, argument) {
                var i2;
                if (argument < 0) {
                  i2 = argument + length;
                } else if (argument > length) {
                  i2 = length;
                } else {
                  i2 = argument;
                }
                for (; --i2 >= 0; ) {
                  matchIndexes.push(i2);
                }
                return matchIndexes;
              }),
              gt: createPositionalPseudo(function(matchIndexes, length, argument) {
                var i2 = argument < 0 ? argument + length : argument;
                for (; ++i2 < length; ) {
                  matchIndexes.push(i2);
                }
                return matchIndexes;
              })
            }
          };
          Expr.pseudos.nth = Expr.pseudos.eq;
          for (i in { radio: true, checkbox: true, file: true, password: true, image: true }) {
            Expr.pseudos[i] = createInputPseudo(i);
          }
          for (i in { submit: true, reset: true }) {
            Expr.pseudos[i] = createButtonPseudo(i);
          }
          function setFilters() {
          }
          setFilters.prototype = Expr.filters = Expr.pseudos;
          Expr.setFilters = new setFilters();
          function tokenize(selector, parseOnly) {
            var matched, match, tokens, type, soFar, groups, preFilters, cached = tokenCache[selector + " "];
            if (cached) {
              return parseOnly ? 0 : cached.slice(0);
            }
            soFar = selector;
            groups = [];
            preFilters = Expr.preFilter;
            while (soFar) {
              if (!matched || (match = rcomma.exec(soFar))) {
                if (match) {
                  soFar = soFar.slice(match[0].length) || soFar;
                }
                groups.push(tokens = []);
              }
              matched = false;
              if (match = rleadingCombinator.exec(soFar)) {
                matched = match.shift();
                tokens.push({
                  value: matched,
                  // Cast descendant combinators to space
                  type: match[0].replace(rtrimCSS, " ")
                });
                soFar = soFar.slice(matched.length);
              }
              for (type in Expr.filter) {
                if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
                  matched = match.shift();
                  tokens.push({
                    value: matched,
                    type,
                    matches: match
                  });
                  soFar = soFar.slice(matched.length);
                }
              }
              if (!matched) {
                break;
              }
            }
            if (parseOnly) {
              return soFar.length;
            }
            return soFar ? find.error(selector) : (
              // Cache the tokens
              tokenCache(selector, groups).slice(0)
            );
          }
          function toSelector(tokens) {
            var i2 = 0, len = tokens.length, selector = "";
            for (; i2 < len; i2++) {
              selector += tokens[i2].value;
            }
            return selector;
          }
          function addCombinator(matcher, combinator, base) {
            var dir2 = combinator.dir, skip = combinator.next, key = skip || dir2, checkNonElements = base && key === "parentNode", doneName = done++;
            return combinator.first ? (
              // Check against closest ancestor/preceding element
              function(elem, context, xml) {
                while (elem = elem[dir2]) {
                  if (elem.nodeType === 1 || checkNonElements) {
                    return matcher(elem, context, xml);
                  }
                }
                return false;
              }
            ) : (
              // Check against all ancestor/preceding elements
              function(elem, context, xml) {
                var oldCache, outerCache, newCache = [dirruns, doneName];
                if (xml) {
                  while (elem = elem[dir2]) {
                    if (elem.nodeType === 1 || checkNonElements) {
                      if (matcher(elem, context, xml)) {
                        return true;
                      }
                    }
                  }
                } else {
                  while (elem = elem[dir2]) {
                    if (elem.nodeType === 1 || checkNonElements) {
                      outerCache = elem[expando] || (elem[expando] = {});
                      if (skip && nodeName(elem, skip)) {
                        elem = elem[dir2] || elem;
                      } else if ((oldCache = outerCache[key]) && oldCache[0] === dirruns && oldCache[1] === doneName) {
                        return newCache[2] = oldCache[2];
                      } else {
                        outerCache[key] = newCache;
                        if (newCache[2] = matcher(elem, context, xml)) {
                          return true;
                        }
                      }
                    }
                  }
                }
                return false;
              }
            );
          }
          function elementMatcher(matchers) {
            return matchers.length > 1 ? function(elem, context, xml) {
              var i2 = matchers.length;
              while (i2--) {
                if (!matchers[i2](elem, context, xml)) {
                  return false;
                }
              }
              return true;
            } : matchers[0];
          }
          function multipleContexts(selector, contexts, results) {
            var i2 = 0, len = contexts.length;
            for (; i2 < len; i2++) {
              find(selector, contexts[i2], results);
            }
            return results;
          }
          function condense(unmatched, map, filter, context, xml) {
            var elem, newUnmatched = [], i2 = 0, len = unmatched.length, mapped = map != null;
            for (; i2 < len; i2++) {
              if (elem = unmatched[i2]) {
                if (!filter || filter(elem, context, xml)) {
                  newUnmatched.push(elem);
                  if (mapped) {
                    map.push(i2);
                  }
                }
              }
            }
            return newUnmatched;
          }
          function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
            if (postFilter && !postFilter[expando]) {
              postFilter = setMatcher(postFilter);
            }
            if (postFinder && !postFinder[expando]) {
              postFinder = setMatcher(postFinder, postSelector);
            }
            return markFunction(function(seed, results, context, xml) {
              var temp, i2, elem, matcherOut, preMap = [], postMap = [], preexisting = results.length, elems = seed || multipleContexts(
                selector || "*",
                context.nodeType ? [context] : context,
                []
              ), matcherIn = preFilter && (seed || !selector) ? condense(elems, preMap, preFilter, context, xml) : elems;
              if (matcher) {
                matcherOut = postFinder || (seed ? preFilter : preexisting || postFilter) ? (
                  // ...intermediate processing is necessary
                  []
                ) : (
                  // ...otherwise use results directly
                  results
                );
                matcher(matcherIn, matcherOut, context, xml);
              } else {
                matcherOut = matcherIn;
              }
              if (postFilter) {
                temp = condense(matcherOut, postMap);
                postFilter(temp, [], context, xml);
                i2 = temp.length;
                while (i2--) {
                  if (elem = temp[i2]) {
                    matcherOut[postMap[i2]] = !(matcherIn[postMap[i2]] = elem);
                  }
                }
              }
              if (seed) {
                if (postFinder || preFilter) {
                  if (postFinder) {
                    temp = [];
                    i2 = matcherOut.length;
                    while (i2--) {
                      if (elem = matcherOut[i2]) {
                        temp.push(matcherIn[i2] = elem);
                      }
                    }
                    postFinder(null, matcherOut = [], temp, xml);
                  }
                  i2 = matcherOut.length;
                  while (i2--) {
                    if ((elem = matcherOut[i2]) && (temp = postFinder ? indexOf.call(seed, elem) : preMap[i2]) > -1) {
                      seed[temp] = !(results[temp] = elem);
                    }
                  }
                }
              } else {
                matcherOut = condense(
                  matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut
                );
                if (postFinder) {
                  postFinder(null, results, matcherOut, xml);
                } else {
                  push2.apply(results, matcherOut);
                }
              }
            });
          }
          function matcherFromTokens(tokens) {
            var checkContext, matcher, j, len = tokens.length, leadingRelative = Expr.relative[tokens[0].type], implicitRelative = leadingRelative || Expr.relative[" "], i2 = leadingRelative ? 1 : 0, matchContext = addCombinator(function(elem) {
              return elem === checkContext;
            }, implicitRelative, true), matchAnyContext = addCombinator(function(elem) {
              return indexOf.call(checkContext, elem) > -1;
            }, implicitRelative, true), matchers = [function(elem, context, xml) {
              var ret = !leadingRelative && (xml || context != outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
              checkContext = null;
              return ret;
            }];
            for (; i2 < len; i2++) {
              if (matcher = Expr.relative[tokens[i2].type]) {
                matchers = [addCombinator(elementMatcher(matchers), matcher)];
              } else {
                matcher = Expr.filter[tokens[i2].type].apply(null, tokens[i2].matches);
                if (matcher[expando]) {
                  j = ++i2;
                  for (; j < len; j++) {
                    if (Expr.relative[tokens[j].type]) {
                      break;
                    }
                  }
                  return setMatcher(
                    i2 > 1 && elementMatcher(matchers),
                    i2 > 1 && toSelector(
                      // If the preceding token was a descendant combinator, insert an implicit any-element `*`
                      tokens.slice(0, i2 - 1).concat({ value: tokens[i2 - 2].type === " " ? "*" : "" })
                    ).replace(rtrimCSS, "$1"),
                    matcher,
                    i2 < j && matcherFromTokens(tokens.slice(i2, j)),
                    j < len && matcherFromTokens(tokens = tokens.slice(j)),
                    j < len && toSelector(tokens)
                  );
                }
                matchers.push(matcher);
              }
            }
            return elementMatcher(matchers);
          }
          function matcherFromGroupMatchers(elementMatchers, setMatchers) {
            var bySet = setMatchers.length > 0, byElement = elementMatchers.length > 0, superMatcher = function(seed, context, xml, results, outermost) {
              var elem, j, matcher, matchedCount = 0, i2 = "0", unmatched = seed && [], setMatched = [], contextBackup = outermostContext, elems = seed || byElement && Expr.find.TAG("*", outermost), dirrunsUnique = dirruns += contextBackup == null ? 1 : Math.random() || 0.1, len = elems.length;
              if (outermost) {
                outermostContext = context == document3 || context || outermost;
              }
              for (; i2 !== len && (elem = elems[i2]) != null; i2++) {
                if (byElement && elem) {
                  j = 0;
                  if (!context && elem.ownerDocument != document3) {
                    setDocument(elem);
                    xml = !documentIsHTML;
                  }
                  while (matcher = elementMatchers[j++]) {
                    if (matcher(elem, context || document3, xml)) {
                      push2.call(results, elem);
                      break;
                    }
                  }
                  if (outermost) {
                    dirruns = dirrunsUnique;
                  }
                }
                if (bySet) {
                  if (elem = !matcher && elem) {
                    matchedCount--;
                  }
                  if (seed) {
                    unmatched.push(elem);
                  }
                }
              }
              matchedCount += i2;
              if (bySet && i2 !== matchedCount) {
                j = 0;
                while (matcher = setMatchers[j++]) {
                  matcher(unmatched, setMatched, context, xml);
                }
                if (seed) {
                  if (matchedCount > 0) {
                    while (i2--) {
                      if (!(unmatched[i2] || setMatched[i2])) {
                        setMatched[i2] = pop.call(results);
                      }
                    }
                  }
                  setMatched = condense(setMatched);
                }
                push2.apply(results, setMatched);
                if (outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1) {
                  jQuery2.uniqueSort(results);
                }
              }
              if (outermost) {
                dirruns = dirrunsUnique;
                outermostContext = contextBackup;
              }
              return unmatched;
            };
            return bySet ? markFunction(superMatcher) : superMatcher;
          }
          function compile(selector, match) {
            var i2, setMatchers = [], elementMatchers = [], cached = compilerCache[selector + " "];
            if (!cached) {
              if (!match) {
                match = tokenize(selector);
              }
              i2 = match.length;
              while (i2--) {
                cached = matcherFromTokens(match[i2]);
                if (cached[expando]) {
                  setMatchers.push(cached);
                } else {
                  elementMatchers.push(cached);
                }
              }
              cached = compilerCache(
                selector,
                matcherFromGroupMatchers(elementMatchers, setMatchers)
              );
              cached.selector = selector;
            }
            return cached;
          }
          function select(selector, context, results, seed) {
            var i2, tokens, token, type, find2, compiled = typeof selector === "function" && selector, match = !seed && tokenize(selector = compiled.selector || selector);
            results = results || [];
            if (match.length === 1) {
              tokens = match[0] = match[0].slice(0);
              if (tokens.length > 2 && (token = tokens[0]).type === "ID" && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]) {
                context = (Expr.find.ID(
                  token.matches[0].replace(runescape, funescape),
                  context
                ) || [])[0];
                if (!context) {
                  return results;
                } else if (compiled) {
                  context = context.parentNode;
                }
                selector = selector.slice(tokens.shift().value.length);
              }
              i2 = matchExpr.needsContext.test(selector) ? 0 : tokens.length;
              while (i2--) {
                token = tokens[i2];
                if (Expr.relative[type = token.type]) {
                  break;
                }
                if (find2 = Expr.find[type]) {
                  if (seed = find2(
                    token.matches[0].replace(runescape, funescape),
                    rsibling.test(tokens[0].type) && testContext(context.parentNode) || context
                  )) {
                    tokens.splice(i2, 1);
                    selector = seed.length && toSelector(tokens);
                    if (!selector) {
                      push2.apply(results, seed);
                      return results;
                    }
                    break;
                  }
                }
              }
            }
            (compiled || compile(selector, match))(
              seed,
              context,
              !documentIsHTML,
              results,
              !context || rsibling.test(selector) && testContext(context.parentNode) || context
            );
            return results;
          }
          support.sortStable = expando.split("").sort(sortOrder).join("") === expando;
          setDocument();
          support.sortDetached = assert(function(el) {
            return el.compareDocumentPosition(document3.createElement("fieldset")) & 1;
          });
          jQuery2.find = find;
          jQuery2.expr[":"] = jQuery2.expr.pseudos;
          jQuery2.unique = jQuery2.uniqueSort;
          find.compile = compile;
          find.select = select;
          find.setDocument = setDocument;
          find.tokenize = tokenize;
          find.escape = jQuery2.escapeSelector;
          find.getText = jQuery2.text;
          find.isXML = jQuery2.isXMLDoc;
          find.selectors = jQuery2.expr;
          find.support = jQuery2.support;
          find.uniqueSort = jQuery2.uniqueSort;
        })();
        var dir = function(elem, dir2, until) {
          var matched = [], truncate = until !== void 0;
          while ((elem = elem[dir2]) && elem.nodeType !== 9) {
            if (elem.nodeType === 1) {
              if (truncate && jQuery2(elem).is(until)) {
                break;
              }
              matched.push(elem);
            }
          }
          return matched;
        };
        var siblings = function(n, elem) {
          var matched = [];
          for (; n; n = n.nextSibling) {
            if (n.nodeType === 1 && n !== elem) {
              matched.push(n);
            }
          }
          return matched;
        };
        var rneedsContext = jQuery2.expr.match.needsContext;
        var rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;
        function winnow(elements, qualifier, not) {
          if (isFunction(qualifier)) {
            return jQuery2.grep(elements, function(elem, i) {
              return !!qualifier.call(elem, i, elem) !== not;
            });
          }
          if (qualifier.nodeType) {
            return jQuery2.grep(elements, function(elem) {
              return elem === qualifier !== not;
            });
          }
          if (typeof qualifier !== "string") {
            return jQuery2.grep(elements, function(elem) {
              return indexOf.call(qualifier, elem) > -1 !== not;
            });
          }
          return jQuery2.filter(qualifier, elements, not);
        }
        jQuery2.filter = function(expr, elems, not) {
          var elem = elems[0];
          if (not) {
            expr = ":not(" + expr + ")";
          }
          if (elems.length === 1 && elem.nodeType === 1) {
            return jQuery2.find.matchesSelector(elem, expr) ? [elem] : [];
          }
          return jQuery2.find.matches(expr, jQuery2.grep(elems, function(elem2) {
            return elem2.nodeType === 1;
          }));
        };
        jQuery2.fn.extend({
          find: function(selector) {
            var i, ret, len = this.length, self = this;
            if (typeof selector !== "string") {
              return this.pushStack(jQuery2(selector).filter(function() {
                for (i = 0; i < len; i++) {
                  if (jQuery2.contains(self[i], this)) {
                    return true;
                  }
                }
              }));
            }
            ret = this.pushStack([]);
            for (i = 0; i < len; i++) {
              jQuery2.find(selector, self[i], ret);
            }
            return len > 1 ? jQuery2.uniqueSort(ret) : ret;
          },
          filter: function(selector) {
            return this.pushStack(winnow(this, selector || [], false));
          },
          not: function(selector) {
            return this.pushStack(winnow(this, selector || [], true));
          },
          is: function(selector) {
            return !!winnow(
              this,
              // If this is a positional/relative selector, check membership in the returned set
              // so $("p:first").is("p:last") won't return true for a doc with two "p".
              typeof selector === "string" && rneedsContext.test(selector) ? jQuery2(selector) : selector || [],
              false
            ).length;
          }
        });
        var rootjQuery, rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/, init = jQuery2.fn.init = function(selector, context, root) {
          var match, elem;
          if (!selector) {
            return this;
          }
          root = root || rootjQuery;
          if (typeof selector === "string") {
            if (selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3) {
              match = [null, selector, null];
            } else {
              match = rquickExpr.exec(selector);
            }
            if (match && (match[1] || !context)) {
              if (match[1]) {
                context = context instanceof jQuery2 ? context[0] : context;
                jQuery2.merge(this, jQuery2.parseHTML(
                  match[1],
                  context && context.nodeType ? context.ownerDocument || context : document2,
                  true
                ));
                if (rsingleTag.test(match[1]) && jQuery2.isPlainObject(context)) {
                  for (match in context) {
                    if (isFunction(this[match])) {
                      this[match](context[match]);
                    } else {
                      this.attr(match, context[match]);
                    }
                  }
                }
                return this;
              } else {
                elem = document2.getElementById(match[2]);
                if (elem) {
                  this[0] = elem;
                  this.length = 1;
                }
                return this;
              }
            } else if (!context || context.jquery) {
              return (context || root).find(selector);
            } else {
              return this.constructor(context).find(selector);
            }
          } else if (selector.nodeType) {
            this[0] = selector;
            this.length = 1;
            return this;
          } else if (isFunction(selector)) {
            return root.ready !== void 0 ? root.ready(selector) : (
              // Execute immediately if ready is not present
              selector(jQuery2)
            );
          }
          return jQuery2.makeArray(selector, this);
        };
        init.prototype = jQuery2.fn;
        rootjQuery = jQuery2(document2);
        var rparentsprev = /^(?:parents|prev(?:Until|All))/, guaranteedUnique = {
          children: true,
          contents: true,
          next: true,
          prev: true
        };
        jQuery2.fn.extend({
          has: function(target) {
            var targets = jQuery2(target, this), l = targets.length;
            return this.filter(function() {
              var i = 0;
              for (; i < l; i++) {
                if (jQuery2.contains(this, targets[i])) {
                  return true;
                }
              }
            });
          },
          closest: function(selectors, context) {
            var cur, i = 0, l = this.length, matched = [], targets = typeof selectors !== "string" && jQuery2(selectors);
            if (!rneedsContext.test(selectors)) {
              for (; i < l; i++) {
                for (cur = this[i]; cur && cur !== context; cur = cur.parentNode) {
                  if (cur.nodeType < 11 && (targets ? targets.index(cur) > -1 : (
                    // Don't pass non-elements to jQuery#find
                    cur.nodeType === 1 && jQuery2.find.matchesSelector(cur, selectors)
                  ))) {
                    matched.push(cur);
                    break;
                  }
                }
              }
            }
            return this.pushStack(matched.length > 1 ? jQuery2.uniqueSort(matched) : matched);
          },
          // Determine the position of an element within the set
          index: function(elem) {
            if (!elem) {
              return this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
            }
            if (typeof elem === "string") {
              return indexOf.call(jQuery2(elem), this[0]);
            }
            return indexOf.call(
              this,
              // If it receives a jQuery object, the first element is used
              elem.jquery ? elem[0] : elem
            );
          },
          add: function(selector, context) {
            return this.pushStack(
              jQuery2.uniqueSort(
                jQuery2.merge(this.get(), jQuery2(selector, context))
              )
            );
          },
          addBack: function(selector) {
            return this.add(
              selector == null ? this.prevObject : this.prevObject.filter(selector)
            );
          }
        });
        function sibling(cur, dir2) {
          while ((cur = cur[dir2]) && cur.nodeType !== 1) {
          }
          return cur;
        }
        jQuery2.each({
          parent: function(elem) {
            var parent = elem.parentNode;
            return parent && parent.nodeType !== 11 ? parent : null;
          },
          parents: function(elem) {
            return dir(elem, "parentNode");
          },
          parentsUntil: function(elem, _i, until) {
            return dir(elem, "parentNode", until);
          },
          next: function(elem) {
            return sibling(elem, "nextSibling");
          },
          prev: function(elem) {
            return sibling(elem, "previousSibling");
          },
          nextAll: function(elem) {
            return dir(elem, "nextSibling");
          },
          prevAll: function(elem) {
            return dir(elem, "previousSibling");
          },
          nextUntil: function(elem, _i, until) {
            return dir(elem, "nextSibling", until);
          },
          prevUntil: function(elem, _i, until) {
            return dir(elem, "previousSibling", until);
          },
          siblings: function(elem) {
            return siblings((elem.parentNode || {}).firstChild, elem);
          },
          children: function(elem) {
            return siblings(elem.firstChild);
          },
          contents: function(elem) {
            if (elem.contentDocument != null && // Support: IE 11+
            // <object> elements with no `data` attribute has an object
            // `contentDocument` with a `null` prototype.
            getProto(elem.contentDocument)) {
              return elem.contentDocument;
            }
            if (nodeName(elem, "template")) {
              elem = elem.content || elem;
            }
            return jQuery2.merge([], elem.childNodes);
          }
        }, function(name, fn) {
          jQuery2.fn[name] = function(until, selector) {
            var matched = jQuery2.map(this, fn, until);
            if (name.slice(-5) !== "Until") {
              selector = until;
            }
            if (selector && typeof selector === "string") {
              matched = jQuery2.filter(selector, matched);
            }
            if (this.length > 1) {
              if (!guaranteedUnique[name]) {
                jQuery2.uniqueSort(matched);
              }
              if (rparentsprev.test(name)) {
                matched.reverse();
              }
            }
            return this.pushStack(matched);
          };
        });
        var rnothtmlwhite = /[^\x20\t\r\n\f]+/g;
        function createOptions(options) {
          var object = {};
          jQuery2.each(options.match(rnothtmlwhite) || [], function(_, flag) {
            object[flag] = true;
          });
          return object;
        }
        jQuery2.Callbacks = function(options) {
          options = typeof options === "string" ? createOptions(options) : jQuery2.extend({}, options);
          var firing, memory, fired, locked, list = [], queue = [], firingIndex = -1, fire = function() {
            locked = locked || options.once;
            fired = firing = true;
            for (; queue.length; firingIndex = -1) {
              memory = queue.shift();
              while (++firingIndex < list.length) {
                if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) {
                  firingIndex = list.length;
                  memory = false;
                }
              }
            }
            if (!options.memory) {
              memory = false;
            }
            firing = false;
            if (locked) {
              if (memory) {
                list = [];
              } else {
                list = "";
              }
            }
          }, self = {
            // Add a callback or a collection of callbacks to the list
            add: function() {
              if (list) {
                if (memory && !firing) {
                  firingIndex = list.length - 1;
                  queue.push(memory);
                }
                (function add(args) {
                  jQuery2.each(args, function(_, arg) {
                    if (isFunction(arg)) {
                      if (!options.unique || !self.has(arg)) {
                        list.push(arg);
                      }
                    } else if (arg && arg.length && toType(arg) !== "string") {
                      add(arg);
                    }
                  });
                })(arguments);
                if (memory && !firing) {
                  fire();
                }
              }
              return this;
            },
            // Remove a callback from the list
            remove: function() {
              jQuery2.each(arguments, function(_, arg) {
                var index;
                while ((index = jQuery2.inArray(arg, list, index)) > -1) {
                  list.splice(index, 1);
                  if (index <= firingIndex) {
                    firingIndex--;
                  }
                }
              });
              return this;
            },
            // Check if a given callback is in the list.
            // If no argument is given, return whether or not list has callbacks attached.
            has: function(fn) {
              return fn ? jQuery2.inArray(fn, list) > -1 : list.length > 0;
            },
            // Remove all callbacks from the list
            empty: function() {
              if (list) {
                list = [];
              }
              return this;
            },
            // Disable .fire and .add
            // Abort any current/pending executions
            // Clear all callbacks and values
            disable: function() {
              locked = queue = [];
              list = memory = "";
              return this;
            },
            disabled: function() {
              return !list;
            },
            // Disable .fire
            // Also disable .add unless we have memory (since it would have no effect)
            // Abort any pending executions
            lock: function() {
              locked = queue = [];
              if (!memory && !firing) {
                list = memory = "";
              }
              return this;
            },
            locked: function() {
              return !!locked;
            },
            // Call all callbacks with the given context and arguments
            fireWith: function(context, args) {
              if (!locked) {
                args = args || [];
                args = [context, args.slice ? args.slice() : args];
                queue.push(args);
                if (!firing) {
                  fire();
                }
              }
              return this;
            },
            // Call all the callbacks with the given arguments
            fire: function() {
              self.fireWith(this, arguments);
              return this;
            },
            // To know if the callbacks have already been called at least once
            fired: function() {
              return !!fired;
            }
          };
          return self;
        };
        function Identity(v) {
          return v;
        }
        function Thrower(ex) {
          throw ex;
        }
        function adoptValue(value, resolve, reject, noValue) {
          var method;
          try {
            if (value && isFunction(method = value.promise)) {
              method.call(value).done(resolve).fail(reject);
            } else if (value && isFunction(method = value.then)) {
              method.call(value, resolve, reject);
            } else {
              resolve.apply(void 0, [value].slice(noValue));
            }
          } catch (value2) {
            reject.apply(void 0, [value2]);
          }
        }
        jQuery2.extend({
          Deferred: function(func) {
            var tuples = [
              // action, add listener, callbacks,
              // ... .then handlers, argument index, [final state]
              [
                "notify",
                "progress",
                jQuery2.Callbacks("memory"),
                jQuery2.Callbacks("memory"),
                2
              ],
              [
                "resolve",
                "done",
                jQuery2.Callbacks("once memory"),
                jQuery2.Callbacks("once memory"),
                0,
                "resolved"
              ],
              [
                "reject",
                "fail",
                jQuery2.Callbacks("once memory"),
                jQuery2.Callbacks("once memory"),
                1,
                "rejected"
              ]
            ], state = "pending", promise = {
              state: function() {
                return state;
              },
              always: function() {
                deferred.done(arguments).fail(arguments);
                return this;
              },
              "catch": function(fn) {
                return promise.then(null, fn);
              },
              // Keep pipe for back-compat
              pipe: function() {
                var fns = arguments;
                return jQuery2.Deferred(function(newDefer) {
                  jQuery2.each(tuples, function(_i, tuple) {
                    var fn = isFunction(fns[tuple[4]]) && fns[tuple[4]];
                    deferred[tuple[1]](function() {
                      var returned = fn && fn.apply(this, arguments);
                      if (returned && isFunction(returned.promise)) {
                        returned.promise().progress(newDefer.notify).done(newDefer.resolve).fail(newDefer.reject);
                      } else {
                        newDefer[tuple[0] + "With"](
                          this,
                          fn ? [returned] : arguments
                        );
                      }
                    });
                  });
                  fns = null;
                }).promise();
              },
              then: function(onFulfilled, onRejected, onProgress) {
                var maxDepth = 0;
                function resolve(depth, deferred2, handler, special) {
                  return function() {
                    var that = this, args = arguments, mightThrow = function() {
                      var returned, then;
                      if (depth < maxDepth) {
                        return;
                      }
                      returned = handler.apply(that, args);
                      if (returned === deferred2.promise()) {
                        throw new TypeError("Thenable self-resolution");
                      }
                      then = returned && // Support: Promises/A+ section 2.3.4
                      // https://promisesaplus.com/#point-64
                      // Only check objects and functions for thenability
                      (typeof returned === "object" || typeof returned === "function") && returned.then;
                      if (isFunction(then)) {
                        if (special) {
                          then.call(
                            returned,
                            resolve(maxDepth, deferred2, Identity, special),
                            resolve(maxDepth, deferred2, Thrower, special)
                          );
                        } else {
                          maxDepth++;
                          then.call(
                            returned,
                            resolve(maxDepth, deferred2, Identity, special),
                            resolve(maxDepth, deferred2, Thrower, special),
                            resolve(
                              maxDepth,
                              deferred2,
                              Identity,
                              deferred2.notifyWith
                            )
                          );
                        }
                      } else {
                        if (handler !== Identity) {
                          that = void 0;
                          args = [returned];
                        }
                        (special || deferred2.resolveWith)(that, args);
                      }
                    }, process = special ? mightThrow : function() {
                      try {
                        mightThrow();
                      } catch (e) {
                        if (jQuery2.Deferred.exceptionHook) {
                          jQuery2.Deferred.exceptionHook(
                            e,
                            process.error
                          );
                        }
                        if (depth + 1 >= maxDepth) {
                          if (handler !== Thrower) {
                            that = void 0;
                            args = [e];
                          }
                          deferred2.rejectWith(that, args);
                        }
                      }
                    };
                    if (depth) {
                      process();
                    } else {
                      if (jQuery2.Deferred.getErrorHook) {
                        process.error = jQuery2.Deferred.getErrorHook();
                      } else if (jQuery2.Deferred.getStackHook) {
                        process.error = jQuery2.Deferred.getStackHook();
                      }
                      window2.setTimeout(process);
                    }
                  };
                }
                return jQuery2.Deferred(function(newDefer) {
                  tuples[0][3].add(
                    resolve(
                      0,
                      newDefer,
                      isFunction(onProgress) ? onProgress : Identity,
                      newDefer.notifyWith
                    )
                  );
                  tuples[1][3].add(
                    resolve(
                      0,
                      newDefer,
                      isFunction(onFulfilled) ? onFulfilled : Identity
                    )
                  );
                  tuples[2][3].add(
                    resolve(
                      0,
                      newDefer,
                      isFunction(onRejected) ? onRejected : Thrower
                    )
                  );
                }).promise();
              },
              // Get a promise for this deferred
              // If obj is provided, the promise aspect is added to the object
              promise: function(obj) {
                return obj != null ? jQuery2.extend(obj, promise) : promise;
              }
            }, deferred = {};
            jQuery2.each(tuples, function(i, tuple) {
              var list = tuple[2], stateString = tuple[5];
              promise[tuple[1]] = list.add;
              if (stateString) {
                list.add(
                  function() {
                    state = stateString;
                  },
                  // rejected_callbacks.disable
                  // fulfilled_callbacks.disable
                  tuples[3 - i][2].disable,
                  // rejected_handlers.disable
                  // fulfilled_handlers.disable
                  tuples[3 - i][3].disable,
                  // progress_callbacks.lock
                  tuples[0][2].lock,
                  // progress_handlers.lock
                  tuples[0][3].lock
                );
              }
              list.add(tuple[3].fire);
              deferred[tuple[0]] = function() {
                deferred[tuple[0] + "With"](this === deferred ? void 0 : this, arguments);
                return this;
              };
              deferred[tuple[0] + "With"] = list.fireWith;
            });
            promise.promise(deferred);
            if (func) {
              func.call(deferred, deferred);
            }
            return deferred;
          },
          // Deferred helper
          when: function(singleValue) {
            var remaining = arguments.length, i = remaining, resolveContexts = Array(i), resolveValues = slice.call(arguments), primary = jQuery2.Deferred(), updateFunc = function(i2) {
              return function(value) {
                resolveContexts[i2] = this;
                resolveValues[i2] = arguments.length > 1 ? slice.call(arguments) : value;
                if (!--remaining) {
                  primary.resolveWith(resolveContexts, resolveValues);
                }
              };
            };
            if (remaining <= 1) {
              adoptValue(
                singleValue,
                primary.done(updateFunc(i)).resolve,
                primary.reject,
                !remaining
              );
              if (primary.state() === "pending" || isFunction(resolveValues[i] && resolveValues[i].then)) {
                return primary.then();
              }
            }
            while (i--) {
              adoptValue(resolveValues[i], updateFunc(i), primary.reject);
            }
            return primary.promise();
          }
        });
        var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
        jQuery2.Deferred.exceptionHook = function(error, asyncError) {
          if (window2.console && window2.console.warn && error && rerrorNames.test(error.name)) {
            window2.console.warn(
              "jQuery.Deferred exception: " + error.message,
              error.stack,
              asyncError
            );
          }
        };
        jQuery2.readyException = function(error) {
          window2.setTimeout(function() {
            throw error;
          });
        };
        var readyList = jQuery2.Deferred();
        jQuery2.fn.ready = function(fn) {
          readyList.then(fn).catch(function(error) {
            jQuery2.readyException(error);
          });
          return this;
        };
        jQuery2.extend({
          // Is the DOM ready to be used? Set to true once it occurs.
          isReady: false,
          // A counter to track how many items to wait for before
          // the ready event fires. See trac-6781
          readyWait: 1,
          // Handle when the DOM is ready
          ready: function(wait) {
            if (wait === true ? --jQuery2.readyWait : jQuery2.isReady) {
              return;
            }
            jQuery2.isReady = true;
            if (wait !== true && --jQuery2.readyWait > 0) {
              return;
            }
            readyList.resolveWith(document2, [jQuery2]);
          }
        });
        jQuery2.ready.then = readyList.then;
        function completed() {
          document2.removeEventListener("DOMContentLoaded", completed);
          window2.removeEventListener("load", completed);
          jQuery2.ready();
        }
        if (document2.readyState === "complete" || document2.readyState !== "loading" && !document2.documentElement.doScroll) {
          window2.setTimeout(jQuery2.ready);
        } else {
          document2.addEventListener("DOMContentLoaded", completed);
          window2.addEventListener("load", completed);
        }
        var access = function(elems, fn, key, value, chainable, emptyGet, raw) {
          var i = 0, len = elems.length, bulk = key == null;
          if (toType(key) === "object") {
            chainable = true;
            for (i in key) {
              access(elems, fn, i, key[i], true, emptyGet, raw);
            }
          } else if (value !== void 0) {
            chainable = true;
            if (!isFunction(value)) {
              raw = true;
            }
            if (bulk) {
              if (raw) {
                fn.call(elems, value);
                fn = null;
              } else {
                bulk = fn;
                fn = function(elem, _key, value2) {
                  return bulk.call(jQuery2(elem), value2);
                };
              }
            }
            if (fn) {
              for (; i < len; i++) {
                fn(
                  elems[i],
                  key,
                  raw ? value : value.call(elems[i], i, fn(elems[i], key))
                );
              }
            }
          }
          if (chainable) {
            return elems;
          }
          if (bulk) {
            return fn.call(elems);
          }
          return len ? fn(elems[0], key) : emptyGet;
        };
        var rmsPrefix = /^-ms-/, rdashAlpha = /-([a-z])/g;
        function fcamelCase(_all, letter) {
          return letter.toUpperCase();
        }
        function camelCase(string) {
          return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
        }
        var acceptData = function(owner) {
          return owner.nodeType === 1 || owner.nodeType === 9 || !+owner.nodeType;
        };
        function Data() {
          this.expando = jQuery2.expando + Data.uid++;
        }
        Data.uid = 1;
        Data.prototype = {
          cache: function(owner) {
            var value = owner[this.expando];
            if (!value) {
              value = {};
              if (acceptData(owner)) {
                if (owner.nodeType) {
                  owner[this.expando] = value;
                } else {
                  Object.defineProperty(owner, this.expando, {
                    value,
                    configurable: true
                  });
                }
              }
            }
            return value;
          },
          set: function(owner, data, value) {
            var prop, cache = this.cache(owner);
            if (typeof data === "string") {
              cache[camelCase(data)] = value;
            } else {
              for (prop in data) {
                cache[camelCase(prop)] = data[prop];
              }
            }
            return cache;
          },
          get: function(owner, key) {
            return key === void 0 ? this.cache(owner) : (
              // Always use camelCase key (gh-2257)
              owner[this.expando] && owner[this.expando][camelCase(key)]
            );
          },
          access: function(owner, key, value) {
            if (key === void 0 || key && typeof key === "string" && value === void 0) {
              return this.get(owner, key);
            }
            this.set(owner, key, value);
            return value !== void 0 ? value : key;
          },
          remove: function(owner, key) {
            var i, cache = owner[this.expando];
            if (cache === void 0) {
              return;
            }
            if (key !== void 0) {
              if (Array.isArray(key)) {
                key = key.map(camelCase);
              } else {
                key = camelCase(key);
                key = key in cache ? [key] : key.match(rnothtmlwhite) || [];
              }
              i = key.length;
              while (i--) {
                delete cache[key[i]];
              }
            }
            if (key === void 0 || jQuery2.isEmptyObject(cache)) {
              if (owner.nodeType) {
                owner[this.expando] = void 0;
              } else {
                delete owner[this.expando];
              }
            }
          },
          hasData: function(owner) {
            var cache = owner[this.expando];
            return cache !== void 0 && !jQuery2.isEmptyObject(cache);
          }
        };
        var dataPriv = new Data();
        var dataUser = new Data();
        var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, rmultiDash = /[A-Z]/g;
        function getData(data) {
          if (data === "true") {
            return true;
          }
          if (data === "false") {
            return false;
          }
          if (data === "null") {
            return null;
          }
          if (data === +data + "") {
            return +data;
          }
          if (rbrace.test(data)) {
            return JSON.parse(data);
          }
          return data;
        }
        function dataAttr(elem, key, data) {
          var name;
          if (data === void 0 && elem.nodeType === 1) {
            name = "data-" + key.replace(rmultiDash, "-$&").toLowerCase();
            data = elem.getAttribute(name);
            if (typeof data === "string") {
              try {
                data = getData(data);
              } catch (e) {
              }
              dataUser.set(elem, key, data);
            } else {
              data = void 0;
            }
          }
          return data;
        }
        jQuery2.extend({
          hasData: function(elem) {
            return dataUser.hasData(elem) || dataPriv.hasData(elem);
          },
          data: function(elem, name, data) {
            return dataUser.access(elem, name, data);
          },
          removeData: function(elem, name) {
            dataUser.remove(elem, name);
          },
          // TODO: Now that all calls to _data and _removeData have been replaced
          // with direct calls to dataPriv methods, these can be deprecated.
          _data: function(elem, name, data) {
            return dataPriv.access(elem, name, data);
          },
          _removeData: function(elem, name) {
            dataPriv.remove(elem, name);
          }
        });
        jQuery2.fn.extend({
          data: function(key, value) {
            var i, name, data, elem = this[0], attrs = elem && elem.attributes;
            if (key === void 0) {
              if (this.length) {
                data = dataUser.get(elem);
                if (elem.nodeType === 1 && !dataPriv.get(elem, "hasDataAttrs")) {
                  i = attrs.length;
                  while (i--) {
                    if (attrs[i]) {
                      name = attrs[i].name;
                      if (name.indexOf("data-") === 0) {
                        name = camelCase(name.slice(5));
                        dataAttr(elem, name, data[name]);
                      }
                    }
                  }
                  dataPriv.set(elem, "hasDataAttrs", true);
                }
              }
              return data;
            }
            if (typeof key === "object") {
              return this.each(function() {
                dataUser.set(this, key);
              });
            }
            return access(this, function(value2) {
              var data2;
              if (elem && value2 === void 0) {
                data2 = dataUser.get(elem, key);
                if (data2 !== void 0) {
                  return data2;
                }
                data2 = dataAttr(elem, key);
                if (data2 !== void 0) {
                  return data2;
                }
                return;
              }
              this.each(function() {
                dataUser.set(this, key, value2);
              });
            }, null, value, arguments.length > 1, null, true);
          },
          removeData: function(key) {
            return this.each(function() {
              dataUser.remove(this, key);
            });
          }
        });
        jQuery2.extend({
          queue: function(elem, type, data) {
            var queue;
            if (elem) {
              type = (type || "fx") + "queue";
              queue = dataPriv.get(elem, type);
              if (data) {
                if (!queue || Array.isArray(data)) {
                  queue = dataPriv.access(elem, type, jQuery2.makeArray(data));
                } else {
                  queue.push(data);
                }
              }
              return queue || [];
            }
          },
          dequeue: function(elem, type) {
            type = type || "fx";
            var queue = jQuery2.queue(elem, type), startLength = queue.length, fn = queue.shift(), hooks = jQuery2._queueHooks(elem, type), next = function() {
              jQuery2.dequeue(elem, type);
            };
            if (fn === "inprogress") {
              fn = queue.shift();
              startLength--;
            }
            if (fn) {
              if (type === "fx") {
                queue.unshift("inprogress");
              }
              delete hooks.stop;
              fn.call(elem, next, hooks);
            }
            if (!startLength && hooks) {
              hooks.empty.fire();
            }
          },
          // Not public - generate a queueHooks object, or return the current one
          _queueHooks: function(elem, type) {
            var key = type + "queueHooks";
            return dataPriv.get(elem, key) || dataPriv.access(elem, key, {
              empty: jQuery2.Callbacks("once memory").add(function() {
                dataPriv.remove(elem, [type + "queue", key]);
              })
            });
          }
        });
        jQuery2.fn.extend({
          queue: function(type, data) {
            var setter = 2;
            if (typeof type !== "string") {
              data = type;
              type = "fx";
              setter--;
            }
            if (arguments.length < setter) {
              return jQuery2.queue(this[0], type);
            }
            return data === void 0 ? this : this.each(function() {
              var queue = jQuery2.queue(this, type, data);
              jQuery2._queueHooks(this, type);
              if (type === "fx" && queue[0] !== "inprogress") {
                jQuery2.dequeue(this, type);
              }
            });
          },
          dequeue: function(type) {
            return this.each(function() {
              jQuery2.dequeue(this, type);
            });
          },
          clearQueue: function(type) {
            return this.queue(type || "fx", []);
          },
          // Get a promise resolved when queues of a certain type
          // are emptied (fx is the type by default)
          promise: function(type, obj) {
            var tmp, count = 1, defer = jQuery2.Deferred(), elements = this, i = this.length, resolve = function() {
              if (!--count) {
                defer.resolveWith(elements, [elements]);
              }
            };
            if (typeof type !== "string") {
              obj = type;
              type = void 0;
            }
            type = type || "fx";
            while (i--) {
              tmp = dataPriv.get(elements[i], type + "queueHooks");
              if (tmp && tmp.empty) {
                count++;
                tmp.empty.add(resolve);
              }
            }
            resolve();
            return defer.promise(obj);
          }
        });
        var pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
        var rcssNum = new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i");
        var cssExpand = ["Top", "Right", "Bottom", "Left"];
        var documentElement = document2.documentElement;
        var isAttached = function(elem) {
          return jQuery2.contains(elem.ownerDocument, elem);
        }, composed = { composed: true };
        if (documentElement.getRootNode) {
          isAttached = function(elem) {
            return jQuery2.contains(elem.ownerDocument, elem) || elem.getRootNode(composed) === elem.ownerDocument;
          };
        }
        var isHiddenWithinTree = function(elem, el) {
          elem = el || elem;
          return elem.style.display === "none" || elem.style.display === "" && // Otherwise, check computed style
          // Support: Firefox <=43 - 45
          // Disconnected elements can have computed display: none, so first confirm that elem is
          // in the document.
          isAttached(elem) && jQuery2.css(elem, "display") === "none";
        };
        function adjustCSS(elem, prop, valueParts, tween) {
          var adjusted, scale, maxIterations = 20, currentValue = tween ? function() {
            return tween.cur();
          } : function() {
            return jQuery2.css(elem, prop, "");
          }, initial = currentValue(), unit = valueParts && valueParts[3] || (jQuery2.cssNumber[prop] ? "" : "px"), initialInUnit = elem.nodeType && (jQuery2.cssNumber[prop] || unit !== "px" && +initial) && rcssNum.exec(jQuery2.css(elem, prop));
          if (initialInUnit && initialInUnit[3] !== unit) {
            initial = initial / 2;
            unit = unit || initialInUnit[3];
            initialInUnit = +initial || 1;
            while (maxIterations--) {
              jQuery2.style(elem, prop, initialInUnit + unit);
              if ((1 - scale) * (1 - (scale = currentValue() / initial || 0.5)) <= 0) {
                maxIterations = 0;
              }
              initialInUnit = initialInUnit / scale;
            }
            initialInUnit = initialInUnit * 2;
            jQuery2.style(elem, prop, initialInUnit + unit);
            valueParts = valueParts || [];
          }
          if (valueParts) {
            initialInUnit = +initialInUnit || +initial || 0;
            adjusted = valueParts[1] ? initialInUnit + (valueParts[1] + 1) * valueParts[2] : +valueParts[2];
            if (tween) {
              tween.unit = unit;
              tween.start = initialInUnit;
              tween.end = adjusted;
            }
          }
          return adjusted;
        }
        var defaultDisplayMap = {};
        function getDefaultDisplay(elem) {
          var temp, doc = elem.ownerDocument, nodeName2 = elem.nodeName, display = defaultDisplayMap[nodeName2];
          if (display) {
            return display;
          }
          temp = doc.body.appendChild(doc.createElement(nodeName2));
          display = jQuery2.css(temp, "display");
          temp.parentNode.removeChild(temp);
          if (display === "none") {
            display = "block";
          }
          defaultDisplayMap[nodeName2] = display;
          return display;
        }
        function showHide(elements, show) {
          var display, elem, values = [], index = 0, length = elements.length;
          for (; index < length; index++) {
            elem = elements[index];
            if (!elem.style) {
              continue;
            }
            display = elem.style.display;
            if (show) {
              if (display === "none") {
                values[index] = dataPriv.get(elem, "display") || null;
                if (!values[index]) {
                  elem.style.display = "";
                }
              }
              if (elem.style.display === "" && isHiddenWithinTree(elem)) {
                values[index] = getDefaultDisplay(elem);
              }
            } else {
              if (display !== "none") {
                values[index] = "none";
                dataPriv.set(elem, "display", display);
              }
            }
          }
          for (index = 0; index < length; index++) {
            if (values[index] != null) {
              elements[index].style.display = values[index];
            }
          }
          return elements;
        }
        jQuery2.fn.extend({
          show: function() {
            return showHide(this, true);
          },
          hide: function() {
            return showHide(this);
          },
          toggle: function(state) {
            if (typeof state === "boolean") {
              return state ? this.show() : this.hide();
            }
            return this.each(function() {
              if (isHiddenWithinTree(this)) {
                jQuery2(this).show();
              } else {
                jQuery2(this).hide();
              }
            });
          }
        });
        var rcheckableType = /^(?:checkbox|radio)$/i;
        var rtagName = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i;
        var rscriptType = /^$|^module$|\/(?:java|ecma)script/i;
        (function() {
          var fragment = document2.createDocumentFragment(), div = fragment.appendChild(document2.createElement("div")), input = document2.createElement("input");
          input.setAttribute("type", "radio");
          input.setAttribute("checked", "checked");
          input.setAttribute("name", "t");
          div.appendChild(input);
          support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;
          div.innerHTML = "<textarea>x</textarea>";
          support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;
          div.innerHTML = "<option></option>";
          support.option = !!div.lastChild;
        })();
        var wrapMap = {
          // XHTML parsers do not magically insert elements in the
          // same way that tag soup parsers do. So we cannot shorten
          // this by omitting <tbody> or other required elements.
          thead: [1, "<table>", "</table>"],
          col: [2, "<table><colgroup>", "</colgroup></table>"],
          tr: [2, "<table><tbody>", "</tbody></table>"],
          td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
          _default: [0, "", ""]
        };
        wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
        wrapMap.th = wrapMap.td;
        if (!support.option) {
          wrapMap.optgroup = wrapMap.option = [1, "<select multiple='multiple'>", "</select>"];
        }
        function getAll(context, tag) {
          var ret;
          if (typeof context.getElementsByTagName !== "undefined") {
            ret = context.getElementsByTagName(tag || "*");
          } else if (typeof context.querySelectorAll !== "undefined") {
            ret = context.querySelectorAll(tag || "*");
          } else {
            ret = [];
          }
          if (tag === void 0 || tag && nodeName(context, tag)) {
            return jQuery2.merge([context], ret);
          }
          return ret;
        }
        function setGlobalEval(elems, refElements) {
          var i = 0, l = elems.length;
          for (; i < l; i++) {
            dataPriv.set(
              elems[i],
              "globalEval",
              !refElements || dataPriv.get(refElements[i], "globalEval")
            );
          }
        }
        var rhtml = /<|&#?\w+;/;
        function buildFragment(elems, context, scripts, selection, ignored) {
          var elem, tmp, tag, wrap, attached, j, fragment = context.createDocumentFragment(), nodes = [], i = 0, l = elems.length;
          for (; i < l; i++) {
            elem = elems[i];
            if (elem || elem === 0) {
              if (toType(elem) === "object") {
                jQuery2.merge(nodes, elem.nodeType ? [elem] : elem);
              } else if (!rhtml.test(elem)) {
                nodes.push(context.createTextNode(elem));
              } else {
                tmp = tmp || fragment.appendChild(context.createElement("div"));
                tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();
                wrap = wrapMap[tag] || wrapMap._default;
                tmp.innerHTML = wrap[1] + jQuery2.htmlPrefilter(elem) + wrap[2];
                j = wrap[0];
                while (j--) {
                  tmp = tmp.lastChild;
                }
                jQuery2.merge(nodes, tmp.childNodes);
                tmp = fragment.firstChild;
                tmp.textContent = "";
              }
            }
          }
          fragment.textContent = "";
          i = 0;
          while (elem = nodes[i++]) {
            if (selection && jQuery2.inArray(elem, selection) > -1) {
              if (ignored) {
                ignored.push(elem);
              }
              continue;
            }
            attached = isAttached(elem);
            tmp = getAll(fragment.appendChild(elem), "script");
            if (attached) {
              setGlobalEval(tmp);
            }
            if (scripts) {
              j = 0;
              while (elem = tmp[j++]) {
                if (rscriptType.test(elem.type || "")) {
                  scripts.push(elem);
                }
              }
            }
          }
          return fragment;
        }
        var rtypenamespace = /^([^.]*)(?:\.(.+)|)/;
        function returnTrue() {
          return true;
        }
        function returnFalse() {
          return false;
        }
        function on(elem, types, selector, data, fn, one) {
          var origFn, type;
          if (typeof types === "object") {
            if (typeof selector !== "string") {
              data = data || selector;
              selector = void 0;
            }
            for (type in types) {
              on(elem, type, selector, data, types[type], one);
            }
            return elem;
          }
          if (data == null && fn == null) {
            fn = selector;
            data = selector = void 0;
          } else if (fn == null) {
            if (typeof selector === "string") {
              fn = data;
              data = void 0;
            } else {
              fn = data;
              data = selector;
              selector = void 0;
            }
          }
          if (fn === false) {
            fn = returnFalse;
          } else if (!fn) {
            return elem;
          }
          if (one === 1) {
            origFn = fn;
            fn = function(event) {
              jQuery2().off(event);
              return origFn.apply(this, arguments);
            };
            fn.guid = origFn.guid || (origFn.guid = jQuery2.guid++);
          }
          return elem.each(function() {
            jQuery2.event.add(this, types, fn, data, selector);
          });
        }
        jQuery2.event = {
          global: {},
          add: function(elem, types, handler, data, selector) {
            var handleObjIn, eventHandle, tmp, events, t2, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.get(elem);
            if (!acceptData(elem)) {
              return;
            }
            if (handler.handler) {
              handleObjIn = handler;
              handler = handleObjIn.handler;
              selector = handleObjIn.selector;
            }
            if (selector) {
              jQuery2.find.matchesSelector(documentElement, selector);
            }
            if (!handler.guid) {
              handler.guid = jQuery2.guid++;
            }
            if (!(events = elemData.events)) {
              events = elemData.events = /* @__PURE__ */ Object.create(null);
            }
            if (!(eventHandle = elemData.handle)) {
              eventHandle = elemData.handle = function(e) {
                return typeof jQuery2 !== "undefined" && jQuery2.event.triggered !== e.type ? jQuery2.event.dispatch.apply(elem, arguments) : void 0;
              };
            }
            types = (types || "").match(rnothtmlwhite) || [""];
            t2 = types.length;
            while (t2--) {
              tmp = rtypenamespace.exec(types[t2]) || [];
              type = origType = tmp[1];
              namespaces = (tmp[2] || "").split(".").sort();
              if (!type) {
                continue;
              }
              special = jQuery2.event.special[type] || {};
              type = (selector ? special.delegateType : special.bindType) || type;
              special = jQuery2.event.special[type] || {};
              handleObj = jQuery2.extend({
                type,
                origType,
                data,
                handler,
                guid: handler.guid,
                selector,
                needsContext: selector && jQuery2.expr.match.needsContext.test(selector),
                namespace: namespaces.join(".")
              }, handleObjIn);
              if (!(handlers = events[type])) {
                handlers = events[type] = [];
                handlers.delegateCount = 0;
                if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {
                  if (elem.addEventListener) {
                    elem.addEventListener(type, eventHandle);
                  }
                }
              }
              if (special.add) {
                special.add.call(elem, handleObj);
                if (!handleObj.handler.guid) {
                  handleObj.handler.guid = handler.guid;
                }
              }
              if (selector) {
                handlers.splice(handlers.delegateCount++, 0, handleObj);
              } else {
                handlers.push(handleObj);
              }
              jQuery2.event.global[type] = true;
            }
          },
          // Detach an event or set of events from an element
          remove: function(elem, types, handler, selector, mappedTypes) {
            var j, origCount, tmp, events, t2, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.hasData(elem) && dataPriv.get(elem);
            if (!elemData || !(events = elemData.events)) {
              return;
            }
            types = (types || "").match(rnothtmlwhite) || [""];
            t2 = types.length;
            while (t2--) {
              tmp = rtypenamespace.exec(types[t2]) || [];
              type = origType = tmp[1];
              namespaces = (tmp[2] || "").split(".").sort();
              if (!type) {
                for (type in events) {
                  jQuery2.event.remove(elem, type + types[t2], handler, selector, true);
                }
                continue;
              }
              special = jQuery2.event.special[type] || {};
              type = (selector ? special.delegateType : special.bindType) || type;
              handlers = events[type] || [];
              tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");
              origCount = j = handlers.length;
              while (j--) {
                handleObj = handlers[j];
                if ((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)) {
                  handlers.splice(j, 1);
                  if (handleObj.selector) {
                    handlers.delegateCount--;
                  }
                  if (special.remove) {
                    special.remove.call(elem, handleObj);
                  }
                }
              }
              if (origCount && !handlers.length) {
                if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {
                  jQuery2.removeEvent(elem, type, elemData.handle);
                }
                delete events[type];
              }
            }
            if (jQuery2.isEmptyObject(events)) {
              dataPriv.remove(elem, "handle events");
            }
          },
          dispatch: function(nativeEvent) {
            var i, j, ret, matched, handleObj, handlerQueue, args = new Array(arguments.length), event = jQuery2.event.fix(nativeEvent), handlers = (dataPriv.get(this, "events") || /* @__PURE__ */ Object.create(null))[event.type] || [], special = jQuery2.event.special[event.type] || {};
            args[0] = event;
            for (i = 1; i < arguments.length; i++) {
              args[i] = arguments[i];
            }
            event.delegateTarget = this;
            if (special.preDispatch && special.preDispatch.call(this, event) === false) {
              return;
            }
            handlerQueue = jQuery2.event.handlers.call(this, event, handlers);
            i = 0;
            while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
              event.currentTarget = matched.elem;
              j = 0;
              while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {
                if (!event.rnamespace || handleObj.namespace === false || event.rnamespace.test(handleObj.namespace)) {
                  event.handleObj = handleObj;
                  event.data = handleObj.data;
                  ret = ((jQuery2.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);
                  if (ret !== void 0) {
                    if ((event.result = ret) === false) {
                      event.preventDefault();
                      event.stopPropagation();
                    }
                  }
                }
              }
            }
            if (special.postDispatch) {
              special.postDispatch.call(this, event);
            }
            return event.result;
          },
          handlers: function(event, handlers) {
            var i, handleObj, sel, matchedHandlers, matchedSelectors, handlerQueue = [], delegateCount = handlers.delegateCount, cur = event.target;
            if (delegateCount && // Support: IE <=9
            // Black-hole SVG <use> instance trees (trac-13180)
            cur.nodeType && // Support: Firefox <=42
            // Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
            // https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
            // Support: IE 11 only
            // ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
            !(event.type === "click" && event.button >= 1)) {
              for (; cur !== this; cur = cur.parentNode || this) {
                if (cur.nodeType === 1 && !(event.type === "click" && cur.disabled === true)) {
                  matchedHandlers = [];
                  matchedSelectors = {};
                  for (i = 0; i < delegateCount; i++) {
                    handleObj = handlers[i];
                    sel = handleObj.selector + " ";
                    if (matchedSelectors[sel] === void 0) {
                      matchedSelectors[sel] = handleObj.needsContext ? jQuery2(sel, this).index(cur) > -1 : jQuery2.find(sel, this, null, [cur]).length;
                    }
                    if (matchedSelectors[sel]) {
                      matchedHandlers.push(handleObj);
                    }
                  }
                  if (matchedHandlers.length) {
                    handlerQueue.push({ elem: cur, handlers: matchedHandlers });
                  }
                }
              }
            }
            cur = this;
            if (delegateCount < handlers.length) {
              handlerQueue.push({ elem: cur, handlers: handlers.slice(delegateCount) });
            }
            return handlerQueue;
          },
          addProp: function(name, hook) {
            Object.defineProperty(jQuery2.Event.prototype, name, {
              enumerable: true,
              configurable: true,
              get: isFunction(hook) ? function() {
                if (this.originalEvent) {
                  return hook(this.originalEvent);
                }
              } : function() {
                if (this.originalEvent) {
                  return this.originalEvent[name];
                }
              },
              set: function(value) {
                Object.defineProperty(this, name, {
                  enumerable: true,
                  configurable: true,
                  writable: true,
                  value
                });
              }
            });
          },
          fix: function(originalEvent) {
            return originalEvent[jQuery2.expando] ? originalEvent : new jQuery2.Event(originalEvent);
          },
          special: {
            load: {
              // Prevent triggered image.load events from bubbling to window.load
              noBubble: true
            },
            click: {
              // Utilize native event to ensure correct state for checkable inputs
              setup: function(data) {
                var el = this || data;
                if (rcheckableType.test(el.type) && el.click && nodeName(el, "input")) {
                  leverageNative(el, "click", true);
                }
                return false;
              },
              trigger: function(data) {
                var el = this || data;
                if (rcheckableType.test(el.type) && el.click && nodeName(el, "input")) {
                  leverageNative(el, "click");
                }
                return true;
              },
              // For cross-browser consistency, suppress native .click() on links
              // Also prevent it if we're currently inside a leveraged native-event stack
              _default: function(event) {
                var target = event.target;
                return rcheckableType.test(target.type) && target.click && nodeName(target, "input") && dataPriv.get(target, "click") || nodeName(target, "a");
              }
            },
            beforeunload: {
              postDispatch: function(event) {
                if (event.result !== void 0 && event.originalEvent) {
                  event.originalEvent.returnValue = event.result;
                }
              }
            }
          }
        };
        function leverageNative(el, type, isSetup) {
          if (!isSetup) {
            if (dataPriv.get(el, type) === void 0) {
              jQuery2.event.add(el, type, returnTrue);
            }
            return;
          }
          dataPriv.set(el, type, false);
          jQuery2.event.add(el, type, {
            namespace: false,
            handler: function(event) {
              var result, saved = dataPriv.get(this, type);
              if (event.isTrigger & 1 && this[type]) {
                if (!saved) {
                  saved = slice.call(arguments);
                  dataPriv.set(this, type, saved);
                  this[type]();
                  result = dataPriv.get(this, type);
                  dataPriv.set(this, type, false);
                  if (saved !== result) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return result;
                  }
                } else if ((jQuery2.event.special[type] || {}).delegateType) {
                  event.stopPropagation();
                }
              } else if (saved) {
                dataPriv.set(this, type, jQuery2.event.trigger(
                  saved[0],
                  saved.slice(1),
                  this
                ));
                event.stopPropagation();
                event.isImmediatePropagationStopped = returnTrue;
              }
            }
          });
        }
        jQuery2.removeEvent = function(elem, type, handle) {
          if (elem.removeEventListener) {
            elem.removeEventListener(type, handle);
          }
        };
        jQuery2.Event = function(src, props) {
          if (!(this instanceof jQuery2.Event)) {
            return new jQuery2.Event(src, props);
          }
          if (src && src.type) {
            this.originalEvent = src;
            this.type = src.type;
            this.isDefaultPrevented = src.defaultPrevented || src.defaultPrevented === void 0 && // Support: Android <=2.3 only
            src.returnValue === false ? returnTrue : returnFalse;
            this.target = src.target && src.target.nodeType === 3 ? src.target.parentNode : src.target;
            this.currentTarget = src.currentTarget;
            this.relatedTarget = src.relatedTarget;
          } else {
            this.type = src;
          }
          if (props) {
            jQuery2.extend(this, props);
          }
          this.timeStamp = src && src.timeStamp || Date.now();
          this[jQuery2.expando] = true;
        };
        jQuery2.Event.prototype = {
          constructor: jQuery2.Event,
          isDefaultPrevented: returnFalse,
          isPropagationStopped: returnFalse,
          isImmediatePropagationStopped: returnFalse,
          isSimulated: false,
          preventDefault: function() {
            var e = this.originalEvent;
            this.isDefaultPrevented = returnTrue;
            if (e && !this.isSimulated) {
              e.preventDefault();
            }
          },
          stopPropagation: function() {
            var e = this.originalEvent;
            this.isPropagationStopped = returnTrue;
            if (e && !this.isSimulated) {
              e.stopPropagation();
            }
          },
          stopImmediatePropagation: function() {
            var e = this.originalEvent;
            this.isImmediatePropagationStopped = returnTrue;
            if (e && !this.isSimulated) {
              e.stopImmediatePropagation();
            }
            this.stopPropagation();
          }
        };
        jQuery2.each({
          altKey: true,
          bubbles: true,
          cancelable: true,
          changedTouches: true,
          ctrlKey: true,
          detail: true,
          eventPhase: true,
          metaKey: true,
          pageX: true,
          pageY: true,
          shiftKey: true,
          view: true,
          "char": true,
          code: true,
          charCode: true,
          key: true,
          keyCode: true,
          button: true,
          buttons: true,
          clientX: true,
          clientY: true,
          offsetX: true,
          offsetY: true,
          pointerId: true,
          pointerType: true,
          screenX: true,
          screenY: true,
          targetTouches: true,
          toElement: true,
          touches: true,
          which: true
        }, jQuery2.event.addProp);
        jQuery2.each({ focus: "focusin", blur: "focusout" }, function(type, delegateType) {
          function focusMappedHandler(nativeEvent) {
            if (document2.documentMode) {
              var handle = dataPriv.get(this, "handle"), event = jQuery2.event.fix(nativeEvent);
              event.type = nativeEvent.type === "focusin" ? "focus" : "blur";
              event.isSimulated = true;
              handle(nativeEvent);
              if (event.target === event.currentTarget) {
                handle(event);
              }
            } else {
              jQuery2.event.simulate(
                delegateType,
                nativeEvent.target,
                jQuery2.event.fix(nativeEvent)
              );
            }
          }
          jQuery2.event.special[type] = {
            // Utilize native event if possible so blur/focus sequence is correct
            setup: function() {
              var attaches;
              leverageNative(this, type, true);
              if (document2.documentMode) {
                attaches = dataPriv.get(this, delegateType);
                if (!attaches) {
                  this.addEventListener(delegateType, focusMappedHandler);
                }
                dataPriv.set(this, delegateType, (attaches || 0) + 1);
              } else {
                return false;
              }
            },
            trigger: function() {
              leverageNative(this, type);
              return true;
            },
            teardown: function() {
              var attaches;
              if (document2.documentMode) {
                attaches = dataPriv.get(this, delegateType) - 1;
                if (!attaches) {
                  this.removeEventListener(delegateType, focusMappedHandler);
                  dataPriv.remove(this, delegateType);
                } else {
                  dataPriv.set(this, delegateType, attaches);
                }
              } else {
                return false;
              }
            },
            // Suppress native focus or blur if we're currently inside
            // a leveraged native-event stack
            _default: function(event) {
              return dataPriv.get(event.target, type);
            },
            delegateType
          };
          jQuery2.event.special[delegateType] = {
            setup: function() {
              var doc = this.ownerDocument || this.document || this, dataHolder = document2.documentMode ? this : doc, attaches = dataPriv.get(dataHolder, delegateType);
              if (!attaches) {
                if (document2.documentMode) {
                  this.addEventListener(delegateType, focusMappedHandler);
                } else {
                  doc.addEventListener(type, focusMappedHandler, true);
                }
              }
              dataPriv.set(dataHolder, delegateType, (attaches || 0) + 1);
            },
            teardown: function() {
              var doc = this.ownerDocument || this.document || this, dataHolder = document2.documentMode ? this : doc, attaches = dataPriv.get(dataHolder, delegateType) - 1;
              if (!attaches) {
                if (document2.documentMode) {
                  this.removeEventListener(delegateType, focusMappedHandler);
                } else {
                  doc.removeEventListener(type, focusMappedHandler, true);
                }
                dataPriv.remove(dataHolder, delegateType);
              } else {
                dataPriv.set(dataHolder, delegateType, attaches);
              }
            }
          };
        });
        jQuery2.each({
          mouseenter: "mouseover",
          mouseleave: "mouseout",
          pointerenter: "pointerover",
          pointerleave: "pointerout"
        }, function(orig, fix) {
          jQuery2.event.special[orig] = {
            delegateType: fix,
            bindType: fix,
            handle: function(event) {
              var ret, target = this, related = event.relatedTarget, handleObj = event.handleObj;
              if (!related || related !== target && !jQuery2.contains(target, related)) {
                event.type = handleObj.origType;
                ret = handleObj.handler.apply(this, arguments);
                event.type = fix;
              }
              return ret;
            }
          };
        });
        jQuery2.fn.extend({
          on: function(types, selector, data, fn) {
            return on(this, types, selector, data, fn);
          },
          one: function(types, selector, data, fn) {
            return on(this, types, selector, data, fn, 1);
          },
          off: function(types, selector, fn) {
            var handleObj, type;
            if (types && types.preventDefault && types.handleObj) {
              handleObj = types.handleObj;
              jQuery2(types.delegateTarget).off(
                handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
                handleObj.selector,
                handleObj.handler
              );
              return this;
            }
            if (typeof types === "object") {
              for (type in types) {
                this.off(type, selector, types[type]);
              }
              return this;
            }
            if (selector === false || typeof selector === "function") {
              fn = selector;
              selector = void 0;
            }
            if (fn === false) {
              fn = returnFalse;
            }
            return this.each(function() {
              jQuery2.event.remove(this, types, fn, selector);
            });
          }
        });
        var rnoInnerhtml = /<script|<style|<link/i, rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i, rcleanScript = /^\s*<!\[CDATA\[|\]\]>\s*$/g;
        function manipulationTarget(elem, content) {
          if (nodeName(elem, "table") && nodeName(content.nodeType !== 11 ? content : content.firstChild, "tr")) {
            return jQuery2(elem).children("tbody")[0] || elem;
          }
          return elem;
        }
        function disableScript(elem) {
          elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
          return elem;
        }
        function restoreScript(elem) {
          if ((elem.type || "").slice(0, 5) === "true/") {
            elem.type = elem.type.slice(5);
          } else {
            elem.removeAttribute("type");
          }
          return elem;
        }
        function cloneCopyEvent(src, dest) {
          var i, l, type, pdataOld, udataOld, udataCur, events;
          if (dest.nodeType !== 1) {
            return;
          }
          if (dataPriv.hasData(src)) {
            pdataOld = dataPriv.get(src);
            events = pdataOld.events;
            if (events) {
              dataPriv.remove(dest, "handle events");
              for (type in events) {
                for (i = 0, l = events[type].length; i < l; i++) {
                  jQuery2.event.add(dest, type, events[type][i]);
                }
              }
            }
          }
          if (dataUser.hasData(src)) {
            udataOld = dataUser.access(src);
            udataCur = jQuery2.extend({}, udataOld);
            dataUser.set(dest, udataCur);
          }
        }
        function fixInput(src, dest) {
          var nodeName2 = dest.nodeName.toLowerCase();
          if (nodeName2 === "input" && rcheckableType.test(src.type)) {
            dest.checked = src.checked;
          } else if (nodeName2 === "input" || nodeName2 === "textarea") {
            dest.defaultValue = src.defaultValue;
          }
        }
        function domManip(collection, args, callback, ignored) {
          args = flat(args);
          var fragment, first, scripts, hasScripts, node, doc, i = 0, l = collection.length, iNoClone = l - 1, value = args[0], valueIsFunction = isFunction(value);
          if (valueIsFunction || l > 1 && typeof value === "string" && !support.checkClone && rchecked.test(value)) {
            return collection.each(function(index) {
              var self = collection.eq(index);
              if (valueIsFunction) {
                args[0] = value.call(this, index, self.html());
              }
              domManip(self, args, callback, ignored);
            });
          }
          if (l) {
            fragment = buildFragment(args, collection[0].ownerDocument, false, collection, ignored);
            first = fragment.firstChild;
            if (fragment.childNodes.length === 1) {
              fragment = first;
            }
            if (first || ignored) {
              scripts = jQuery2.map(getAll(fragment, "script"), disableScript);
              hasScripts = scripts.length;
              for (; i < l; i++) {
                node = fragment;
                if (i !== iNoClone) {
                  node = jQuery2.clone(node, true, true);
                  if (hasScripts) {
                    jQuery2.merge(scripts, getAll(node, "script"));
                  }
                }
                callback.call(collection[i], node, i);
              }
              if (hasScripts) {
                doc = scripts[scripts.length - 1].ownerDocument;
                jQuery2.map(scripts, restoreScript);
                for (i = 0; i < hasScripts; i++) {
                  node = scripts[i];
                  if (rscriptType.test(node.type || "") && !dataPriv.access(node, "globalEval") && jQuery2.contains(doc, node)) {
                    if (node.src && (node.type || "").toLowerCase() !== "module") {
                      if (jQuery2._evalUrl && !node.noModule) {
                        jQuery2._evalUrl(node.src, {
                          nonce: node.nonce || node.getAttribute("nonce")
                        }, doc);
                      }
                    } else {
                      DOMEval(node.textContent.replace(rcleanScript, ""), node, doc);
                    }
                  }
                }
              }
            }
          }
          return collection;
        }
        function remove(elem, selector, keepData) {
          var node, nodes = selector ? jQuery2.filter(selector, elem) : elem, i = 0;
          for (; (node = nodes[i]) != null; i++) {
            if (!keepData && node.nodeType === 1) {
              jQuery2.cleanData(getAll(node));
            }
            if (node.parentNode) {
              if (keepData && isAttached(node)) {
                setGlobalEval(getAll(node, "script"));
              }
              node.parentNode.removeChild(node);
            }
          }
          return elem;
        }
        jQuery2.extend({
          htmlPrefilter: function(html) {
            return html;
          },
          clone: function(elem, dataAndEvents, deepDataAndEvents) {
            var i, l, srcElements, destElements, clone = elem.cloneNode(true), inPage = isAttached(elem);
            if (!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery2.isXMLDoc(elem)) {
              destElements = getAll(clone);
              srcElements = getAll(elem);
              for (i = 0, l = srcElements.length; i < l; i++) {
                fixInput(srcElements[i], destElements[i]);
              }
            }
            if (dataAndEvents) {
              if (deepDataAndEvents) {
                srcElements = srcElements || getAll(elem);
                destElements = destElements || getAll(clone);
                for (i = 0, l = srcElements.length; i < l; i++) {
                  cloneCopyEvent(srcElements[i], destElements[i]);
                }
              } else {
                cloneCopyEvent(elem, clone);
              }
            }
            destElements = getAll(clone, "script");
            if (destElements.length > 0) {
              setGlobalEval(destElements, !inPage && getAll(elem, "script"));
            }
            return clone;
          },
          cleanData: function(elems) {
            var data, elem, type, special = jQuery2.event.special, i = 0;
            for (; (elem = elems[i]) !== void 0; i++) {
              if (acceptData(elem)) {
                if (data = elem[dataPriv.expando]) {
                  if (data.events) {
                    for (type in data.events) {
                      if (special[type]) {
                        jQuery2.event.remove(elem, type);
                      } else {
                        jQuery2.removeEvent(elem, type, data.handle);
                      }
                    }
                  }
                  elem[dataPriv.expando] = void 0;
                }
                if (elem[dataUser.expando]) {
                  elem[dataUser.expando] = void 0;
                }
              }
            }
          }
        });
        jQuery2.fn.extend({
          detach: function(selector) {
            return remove(this, selector, true);
          },
          remove: function(selector) {
            return remove(this, selector);
          },
          text: function(value) {
            return access(this, function(value2) {
              return value2 === void 0 ? jQuery2.text(this) : this.empty().each(function() {
                if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                  this.textContent = value2;
                }
              });
            }, null, value, arguments.length);
          },
          append: function() {
            return domManip(this, arguments, function(elem) {
              if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                var target = manipulationTarget(this, elem);
                target.appendChild(elem);
              }
            });
          },
          prepend: function() {
            return domManip(this, arguments, function(elem) {
              if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                var target = manipulationTarget(this, elem);
                target.insertBefore(elem, target.firstChild);
              }
            });
          },
          before: function() {
            return domManip(this, arguments, function(elem) {
              if (this.parentNode) {
                this.parentNode.insertBefore(elem, this);
              }
            });
          },
          after: function() {
            return domManip(this, arguments, function(elem) {
              if (this.parentNode) {
                this.parentNode.insertBefore(elem, this.nextSibling);
              }
            });
          },
          empty: function() {
            var elem, i = 0;
            for (; (elem = this[i]) != null; i++) {
              if (elem.nodeType === 1) {
                jQuery2.cleanData(getAll(elem, false));
                elem.textContent = "";
              }
            }
            return this;
          },
          clone: function(dataAndEvents, deepDataAndEvents) {
            dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
            deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
            return this.map(function() {
              return jQuery2.clone(this, dataAndEvents, deepDataAndEvents);
            });
          },
          html: function(value) {
            return access(this, function(value2) {
              var elem = this[0] || {}, i = 0, l = this.length;
              if (value2 === void 0 && elem.nodeType === 1) {
                return elem.innerHTML;
              }
              if (typeof value2 === "string" && !rnoInnerhtml.test(value2) && !wrapMap[(rtagName.exec(value2) || ["", ""])[1].toLowerCase()]) {
                value2 = jQuery2.htmlPrefilter(value2);
                try {
                  for (; i < l; i++) {
                    elem = this[i] || {};
                    if (elem.nodeType === 1) {
                      jQuery2.cleanData(getAll(elem, false));
                      elem.innerHTML = value2;
                    }
                  }
                  elem = 0;
                } catch (e) {
                }
              }
              if (elem) {
                this.empty().append(value2);
              }
            }, null, value, arguments.length);
          },
          replaceWith: function() {
            var ignored = [];
            return domManip(this, arguments, function(elem) {
              var parent = this.parentNode;
              if (jQuery2.inArray(this, ignored) < 0) {
                jQuery2.cleanData(getAll(this));
                if (parent) {
                  parent.replaceChild(elem, this);
                }
              }
            }, ignored);
          }
        });
        jQuery2.each({
          appendTo: "append",
          prependTo: "prepend",
          insertBefore: "before",
          insertAfter: "after",
          replaceAll: "replaceWith"
        }, function(name, original) {
          jQuery2.fn[name] = function(selector) {
            var elems, ret = [], insert = jQuery2(selector), last = insert.length - 1, i = 0;
            for (; i <= last; i++) {
              elems = i === last ? this : this.clone(true);
              jQuery2(insert[i])[original](elems);
              push.apply(ret, elems.get());
            }
            return this.pushStack(ret);
          };
        });
        var rnumnonpx = new RegExp("^(" + pnum + ")(?!px)[a-z%]+$", "i");
        var rcustomProp = /^--/;
        var getStyles = function(elem) {
          var view = elem.ownerDocument.defaultView;
          if (!view || !view.opener) {
            view = window2;
          }
          return view.getComputedStyle(elem);
        };
        var swap = function(elem, options, callback) {
          var ret, name, old = {};
          for (name in options) {
            old[name] = elem.style[name];
            elem.style[name] = options[name];
          }
          ret = callback.call(elem);
          for (name in options) {
            elem.style[name] = old[name];
          }
          return ret;
        };
        var rboxStyle = new RegExp(cssExpand.join("|"), "i");
        (function() {
          function computeStyleTests() {
            if (!div) {
              return;
            }
            container.style.cssText = "position:absolute;left:-11111px;width:60px;margin-top:1px;padding:0;border:0";
            div.style.cssText = "position:relative;display:block;box-sizing:border-box;overflow:scroll;margin:auto;border:1px;padding:1px;width:60%;top:1%";
            documentElement.appendChild(container).appendChild(div);
            var divStyle = window2.getComputedStyle(div);
            pixelPositionVal = divStyle.top !== "1%";
            reliableMarginLeftVal = roundPixelMeasures(divStyle.marginLeft) === 12;
            div.style.right = "60%";
            pixelBoxStylesVal = roundPixelMeasures(divStyle.right) === 36;
            boxSizingReliableVal = roundPixelMeasures(divStyle.width) === 36;
            div.style.position = "absolute";
            scrollboxSizeVal = roundPixelMeasures(div.offsetWidth / 3) === 12;
            documentElement.removeChild(container);
            div = null;
          }
          function roundPixelMeasures(measure) {
            return Math.round(parseFloat(measure));
          }
          var pixelPositionVal, boxSizingReliableVal, scrollboxSizeVal, pixelBoxStylesVal, reliableTrDimensionsVal, reliableMarginLeftVal, container = document2.createElement("div"), div = document2.createElement("div");
          if (!div.style) {
            return;
          }
          div.style.backgroundClip = "content-box";
          div.cloneNode(true).style.backgroundClip = "";
          support.clearCloneStyle = div.style.backgroundClip === "content-box";
          jQuery2.extend(support, {
            boxSizingReliable: function() {
              computeStyleTests();
              return boxSizingReliableVal;
            },
            pixelBoxStyles: function() {
              computeStyleTests();
              return pixelBoxStylesVal;
            },
            pixelPosition: function() {
              computeStyleTests();
              return pixelPositionVal;
            },
            reliableMarginLeft: function() {
              computeStyleTests();
              return reliableMarginLeftVal;
            },
            scrollboxSize: function() {
              computeStyleTests();
              return scrollboxSizeVal;
            },
            // Support: IE 9 - 11+, Edge 15 - 18+
            // IE/Edge misreport `getComputedStyle` of table rows with width/height
            // set in CSS while `offset*` properties report correct values.
            // Behavior in IE 9 is more subtle than in newer versions & it passes
            // some versions of this test; make sure not to make it pass there!
            //
            // Support: Firefox 70+
            // Only Firefox includes border widths
            // in computed dimensions. (gh-4529)
            reliableTrDimensions: function() {
              var table, tr, trChild, trStyle;
              if (reliableTrDimensionsVal == null) {
                table = document2.createElement("table");
                tr = document2.createElement("tr");
                trChild = document2.createElement("div");
                table.style.cssText = "position:absolute;left:-11111px;border-collapse:separate";
                tr.style.cssText = "box-sizing:content-box;border:1px solid";
                tr.style.height = "1px";
                trChild.style.height = "9px";
                trChild.style.display = "block";
                documentElement.appendChild(table).appendChild(tr).appendChild(trChild);
                trStyle = window2.getComputedStyle(tr);
                reliableTrDimensionsVal = parseInt(trStyle.height, 10) + parseInt(trStyle.borderTopWidth, 10) + parseInt(trStyle.borderBottomWidth, 10) === tr.offsetHeight;
                documentElement.removeChild(table);
              }
              return reliableTrDimensionsVal;
            }
          });
        })();
        function curCSS(elem, name, computed) {
          var width, minWidth, maxWidth, ret, isCustomProp = rcustomProp.test(name), style = elem.style;
          computed = computed || getStyles(elem);
          if (computed) {
            ret = computed.getPropertyValue(name) || computed[name];
            if (isCustomProp && ret) {
              ret = ret.replace(rtrimCSS, "$1") || void 0;
            }
            if (ret === "" && !isAttached(elem)) {
              ret = jQuery2.style(elem, name);
            }
            if (!support.pixelBoxStyles() && rnumnonpx.test(ret) && rboxStyle.test(name)) {
              width = style.width;
              minWidth = style.minWidth;
              maxWidth = style.maxWidth;
              style.minWidth = style.maxWidth = style.width = ret;
              ret = computed.width;
              style.width = width;
              style.minWidth = minWidth;
              style.maxWidth = maxWidth;
            }
          }
          return ret !== void 0 ? (
            // Support: IE <=9 - 11 only
            // IE returns zIndex value as an integer.
            ret + ""
          ) : ret;
        }
        function addGetHookIf(conditionFn, hookFn) {
          return {
            get: function() {
              if (conditionFn()) {
                delete this.get;
                return;
              }
              return (this.get = hookFn).apply(this, arguments);
            }
          };
        }
        var cssPrefixes = ["Webkit", "Moz", "ms"], emptyStyle = document2.createElement("div").style, vendorProps = {};
        function vendorPropName(name) {
          var capName = name[0].toUpperCase() + name.slice(1), i = cssPrefixes.length;
          while (i--) {
            name = cssPrefixes[i] + capName;
            if (name in emptyStyle) {
              return name;
            }
          }
        }
        function finalPropName(name) {
          var final = jQuery2.cssProps[name] || vendorProps[name];
          if (final) {
            return final;
          }
          if (name in emptyStyle) {
            return name;
          }
          return vendorProps[name] = vendorPropName(name) || name;
        }
        var rdisplayswap = /^(none|table(?!-c[ea]).+)/, cssShow = { position: "absolute", visibility: "hidden", display: "block" }, cssNormalTransform = {
          letterSpacing: "0",
          fontWeight: "400"
        };
        function setPositiveNumber(_elem, value, subtract) {
          var matches = rcssNum.exec(value);
          return matches ? (
            // Guard against undefined "subtract", e.g., when used as in cssHooks
            Math.max(0, matches[2] - (subtract || 0)) + (matches[3] || "px")
          ) : value;
        }
        function boxModelAdjustment(elem, dimension, box, isBorderBox, styles, computedVal) {
          var i = dimension === "width" ? 1 : 0, extra = 0, delta = 0, marginDelta = 0;
          if (box === (isBorderBox ? "border" : "content")) {
            return 0;
          }
          for (; i < 4; i += 2) {
            if (box === "margin") {
              marginDelta += jQuery2.css(elem, box + cssExpand[i], true, styles);
            }
            if (!isBorderBox) {
              delta += jQuery2.css(elem, "padding" + cssExpand[i], true, styles);
              if (box !== "padding") {
                delta += jQuery2.css(elem, "border" + cssExpand[i] + "Width", true, styles);
              } else {
                extra += jQuery2.css(elem, "border" + cssExpand[i] + "Width", true, styles);
              }
            } else {
              if (box === "content") {
                delta -= jQuery2.css(elem, "padding" + cssExpand[i], true, styles);
              }
              if (box !== "margin") {
                delta -= jQuery2.css(elem, "border" + cssExpand[i] + "Width", true, styles);
              }
            }
          }
          if (!isBorderBox && computedVal >= 0) {
            delta += Math.max(0, Math.ceil(
              elem["offset" + dimension[0].toUpperCase() + dimension.slice(1)] - computedVal - delta - extra - 0.5
              // If offsetWidth/offsetHeight is unknown, then we can't determine content-box scroll gutter
              // Use an explicit zero to avoid NaN (gh-3964)
            )) || 0;
          }
          return delta + marginDelta;
        }
        function getWidthOrHeight(elem, dimension, extra) {
          var styles = getStyles(elem), boxSizingNeeded = !support.boxSizingReliable() || extra, isBorderBox = boxSizingNeeded && jQuery2.css(elem, "boxSizing", false, styles) === "border-box", valueIsBorderBox = isBorderBox, val = curCSS(elem, dimension, styles), offsetProp = "offset" + dimension[0].toUpperCase() + dimension.slice(1);
          if (rnumnonpx.test(val)) {
            if (!extra) {
              return val;
            }
            val = "auto";
          }
          if ((!support.boxSizingReliable() && isBorderBox || // Support: IE 10 - 11+, Edge 15 - 18+
          // IE/Edge misreport `getComputedStyle` of table rows with width/height
          // set in CSS while `offset*` properties report correct values.
          // Interestingly, in some cases IE 9 doesn't suffer from this issue.
          !support.reliableTrDimensions() && nodeName(elem, "tr") || // Fall back to offsetWidth/offsetHeight when value is "auto"
          // This happens for inline elements with no explicit setting (gh-3571)
          val === "auto" || // Support: Android <=4.1 - 4.3 only
          // Also use offsetWidth/offsetHeight for misreported inline dimensions (gh-3602)
          !parseFloat(val) && jQuery2.css(elem, "display", false, styles) === "inline") && // Make sure the element is visible & connected
          elem.getClientRects().length) {
            isBorderBox = jQuery2.css(elem, "boxSizing", false, styles) === "border-box";
            valueIsBorderBox = offsetProp in elem;
            if (valueIsBorderBox) {
              val = elem[offsetProp];
            }
          }
          val = parseFloat(val) || 0;
          return val + boxModelAdjustment(
            elem,
            dimension,
            extra || (isBorderBox ? "border" : "content"),
            valueIsBorderBox,
            styles,
            // Provide the current computed size to request scroll gutter calculation (gh-3589)
            val
          ) + "px";
        }
        jQuery2.extend({
          // Add in style property hooks for overriding the default
          // behavior of getting and setting a style property
          cssHooks: {
            opacity: {
              get: function(elem, computed) {
                if (computed) {
                  var ret = curCSS(elem, "opacity");
                  return ret === "" ? "1" : ret;
                }
              }
            }
          },
          // Don't automatically add "px" to these possibly-unitless properties
          cssNumber: {
            animationIterationCount: true,
            aspectRatio: true,
            borderImageSlice: true,
            columnCount: true,
            flexGrow: true,
            flexShrink: true,
            fontWeight: true,
            gridArea: true,
            gridColumn: true,
            gridColumnEnd: true,
            gridColumnStart: true,
            gridRow: true,
            gridRowEnd: true,
            gridRowStart: true,
            lineHeight: true,
            opacity: true,
            order: true,
            orphans: true,
            scale: true,
            widows: true,
            zIndex: true,
            zoom: true,
            // SVG-related
            fillOpacity: true,
            floodOpacity: true,
            stopOpacity: true,
            strokeMiterlimit: true,
            strokeOpacity: true
          },
          // Add in properties whose names you wish to fix before
          // setting or getting the value
          cssProps: {},
          // Get and set the style property on a DOM Node
          style: function(elem, name, value, extra) {
            if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
              return;
            }
            var ret, type, hooks, origName = camelCase(name), isCustomProp = rcustomProp.test(name), style = elem.style;
            if (!isCustomProp) {
              name = finalPropName(origName);
            }
            hooks = jQuery2.cssHooks[name] || jQuery2.cssHooks[origName];
            if (value !== void 0) {
              type = typeof value;
              if (type === "string" && (ret = rcssNum.exec(value)) && ret[1]) {
                value = adjustCSS(elem, name, ret);
                type = "number";
              }
              if (value == null || value !== value) {
                return;
              }
              if (type === "number" && !isCustomProp) {
                value += ret && ret[3] || (jQuery2.cssNumber[origName] ? "" : "px");
              }
              if (!support.clearCloneStyle && value === "" && name.indexOf("background") === 0) {
                style[name] = "inherit";
              }
              if (!hooks || !("set" in hooks) || (value = hooks.set(elem, value, extra)) !== void 0) {
                if (isCustomProp) {
                  style.setProperty(name, value);
                } else {
                  style[name] = value;
                }
              }
            } else {
              if (hooks && "get" in hooks && (ret = hooks.get(elem, false, extra)) !== void 0) {
                return ret;
              }
              return style[name];
            }
          },
          css: function(elem, name, extra, styles) {
            var val, num, hooks, origName = camelCase(name), isCustomProp = rcustomProp.test(name);
            if (!isCustomProp) {
              name = finalPropName(origName);
            }
            hooks = jQuery2.cssHooks[name] || jQuery2.cssHooks[origName];
            if (hooks && "get" in hooks) {
              val = hooks.get(elem, true, extra);
            }
            if (val === void 0) {
              val = curCSS(elem, name, styles);
            }
            if (val === "normal" && name in cssNormalTransform) {
              val = cssNormalTransform[name];
            }
            if (extra === "" || extra) {
              num = parseFloat(val);
              return extra === true || isFinite(num) ? num || 0 : val;
            }
            return val;
          }
        });
        jQuery2.each(["height", "width"], function(_i, dimension) {
          jQuery2.cssHooks[dimension] = {
            get: function(elem, computed, extra) {
              if (computed) {
                return rdisplayswap.test(jQuery2.css(elem, "display")) && // Support: Safari 8+
                // Table columns in Safari have non-zero offsetWidth & zero
                // getBoundingClientRect().width unless display is changed.
                // Support: IE <=11 only
                // Running getBoundingClientRect on a disconnected node
                // in IE throws an error.
                (!elem.getClientRects().length || !elem.getBoundingClientRect().width) ? swap(elem, cssShow, function() {
                  return getWidthOrHeight(elem, dimension, extra);
                }) : getWidthOrHeight(elem, dimension, extra);
              }
            },
            set: function(elem, value, extra) {
              var matches, styles = getStyles(elem), scrollboxSizeBuggy = !support.scrollboxSize() && styles.position === "absolute", boxSizingNeeded = scrollboxSizeBuggy || extra, isBorderBox = boxSizingNeeded && jQuery2.css(elem, "boxSizing", false, styles) === "border-box", subtract = extra ? boxModelAdjustment(
                elem,
                dimension,
                extra,
                isBorderBox,
                styles
              ) : 0;
              if (isBorderBox && scrollboxSizeBuggy) {
                subtract -= Math.ceil(
                  elem["offset" + dimension[0].toUpperCase() + dimension.slice(1)] - parseFloat(styles[dimension]) - boxModelAdjustment(elem, dimension, "border", false, styles) - 0.5
                );
              }
              if (subtract && (matches = rcssNum.exec(value)) && (matches[3] || "px") !== "px") {
                elem.style[dimension] = value;
                value = jQuery2.css(elem, dimension);
              }
              return setPositiveNumber(elem, value, subtract);
            }
          };
        });
        jQuery2.cssHooks.marginLeft = addGetHookIf(
          support.reliableMarginLeft,
          function(elem, computed) {
            if (computed) {
              return (parseFloat(curCSS(elem, "marginLeft")) || elem.getBoundingClientRect().left - swap(elem, { marginLeft: 0 }, function() {
                return elem.getBoundingClientRect().left;
              })) + "px";
            }
          }
        );
        jQuery2.each({
          margin: "",
          padding: "",
          border: "Width"
        }, function(prefix, suffix) {
          jQuery2.cssHooks[prefix + suffix] = {
            expand: function(value) {
              var i = 0, expanded = {}, parts = typeof value === "string" ? value.split(" ") : [value];
              for (; i < 4; i++) {
                expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
              }
              return expanded;
            }
          };
          if (prefix !== "margin") {
            jQuery2.cssHooks[prefix + suffix].set = setPositiveNumber;
          }
        });
        jQuery2.fn.extend({
          css: function(name, value) {
            return access(this, function(elem, name2, value2) {
              var styles, len, map = {}, i = 0;
              if (Array.isArray(name2)) {
                styles = getStyles(elem);
                len = name2.length;
                for (; i < len; i++) {
                  map[name2[i]] = jQuery2.css(elem, name2[i], false, styles);
                }
                return map;
              }
              return value2 !== void 0 ? jQuery2.style(elem, name2, value2) : jQuery2.css(elem, name2);
            }, name, value, arguments.length > 1);
          }
        });
        function Tween(elem, options, prop, end, easing) {
          return new Tween.prototype.init(elem, options, prop, end, easing);
        }
        jQuery2.Tween = Tween;
        Tween.prototype = {
          constructor: Tween,
          init: function(elem, options, prop, end, easing, unit) {
            this.elem = elem;
            this.prop = prop;
            this.easing = easing || jQuery2.easing._default;
            this.options = options;
            this.start = this.now = this.cur();
            this.end = end;
            this.unit = unit || (jQuery2.cssNumber[prop] ? "" : "px");
          },
          cur: function() {
            var hooks = Tween.propHooks[this.prop];
            return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this);
          },
          run: function(percent) {
            var eased, hooks = Tween.propHooks[this.prop];
            if (this.options.duration) {
              this.pos = eased = jQuery2.easing[this.easing](
                percent,
                this.options.duration * percent,
                0,
                1,
                this.options.duration
              );
            } else {
              this.pos = eased = percent;
            }
            this.now = (this.end - this.start) * eased + this.start;
            if (this.options.step) {
              this.options.step.call(this.elem, this.now, this);
            }
            if (hooks && hooks.set) {
              hooks.set(this);
            } else {
              Tween.propHooks._default.set(this);
            }
            return this;
          }
        };
        Tween.prototype.init.prototype = Tween.prototype;
        Tween.propHooks = {
          _default: {
            get: function(tween) {
              var result;
              if (tween.elem.nodeType !== 1 || tween.elem[tween.prop] != null && tween.elem.style[tween.prop] == null) {
                return tween.elem[tween.prop];
              }
              result = jQuery2.css(tween.elem, tween.prop, "");
              return !result || result === "auto" ? 0 : result;
            },
            set: function(tween) {
              if (jQuery2.fx.step[tween.prop]) {
                jQuery2.fx.step[tween.prop](tween);
              } else if (tween.elem.nodeType === 1 && (jQuery2.cssHooks[tween.prop] || tween.elem.style[finalPropName(tween.prop)] != null)) {
                jQuery2.style(tween.elem, tween.prop, tween.now + tween.unit);
              } else {
                tween.elem[tween.prop] = tween.now;
              }
            }
          }
        };
        Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
          set: function(tween) {
            if (tween.elem.nodeType && tween.elem.parentNode) {
              tween.elem[tween.prop] = tween.now;
            }
          }
        };
        jQuery2.easing = {
          linear: function(p) {
            return p;
          },
          swing: function(p) {
            return 0.5 - Math.cos(p * Math.PI) / 2;
          },
          _default: "swing"
        };
        jQuery2.fx = Tween.prototype.init;
        jQuery2.fx.step = {};
        var fxNow, inProgress, rfxtypes = /^(?:toggle|show|hide)$/, rrun = /queueHooks$/;
        function schedule() {
          if (inProgress) {
            if (document2.hidden === false && window2.requestAnimationFrame) {
              window2.requestAnimationFrame(schedule);
            } else {
              window2.setTimeout(schedule, jQuery2.fx.interval);
            }
            jQuery2.fx.tick();
          }
        }
        function createFxNow() {
          window2.setTimeout(function() {
            fxNow = void 0;
          });
          return fxNow = Date.now();
        }
        function genFx(type, includeWidth) {
          var which, i = 0, attrs = { height: type };
          includeWidth = includeWidth ? 1 : 0;
          for (; i < 4; i += 2 - includeWidth) {
            which = cssExpand[i];
            attrs["margin" + which] = attrs["padding" + which] = type;
          }
          if (includeWidth) {
            attrs.opacity = attrs.width = type;
          }
          return attrs;
        }
        function createTween(value, prop, animation) {
          var tween, collection = (Animation.tweeners[prop] || []).concat(Animation.tweeners["*"]), index = 0, length = collection.length;
          for (; index < length; index++) {
            if (tween = collection[index].call(animation, prop, value)) {
              return tween;
            }
          }
        }
        function defaultPrefilter(elem, props, opts) {
          var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display, isBox = "width" in props || "height" in props, anim = this, orig = {}, style = elem.style, hidden = elem.nodeType && isHiddenWithinTree(elem), dataShow = dataPriv.get(elem, "fxshow");
          if (!opts.queue) {
            hooks = jQuery2._queueHooks(elem, "fx");
            if (hooks.unqueued == null) {
              hooks.unqueued = 0;
              oldfire = hooks.empty.fire;
              hooks.empty.fire = function() {
                if (!hooks.unqueued) {
                  oldfire();
                }
              };
            }
            hooks.unqueued++;
            anim.always(function() {
              anim.always(function() {
                hooks.unqueued--;
                if (!jQuery2.queue(elem, "fx").length) {
                  hooks.empty.fire();
                }
              });
            });
          }
          for (prop in props) {
            value = props[prop];
            if (rfxtypes.test(value)) {
              delete props[prop];
              toggle = toggle || value === "toggle";
              if (value === (hidden ? "hide" : "show")) {
                if (value === "show" && dataShow && dataShow[prop] !== void 0) {
                  hidden = true;
                } else {
                  continue;
                }
              }
              orig[prop] = dataShow && dataShow[prop] || jQuery2.style(elem, prop);
            }
          }
          propTween = !jQuery2.isEmptyObject(props);
          if (!propTween && jQuery2.isEmptyObject(orig)) {
            return;
          }
          if (isBox && elem.nodeType === 1) {
            opts.overflow = [style.overflow, style.overflowX, style.overflowY];
            restoreDisplay = dataShow && dataShow.display;
            if (restoreDisplay == null) {
              restoreDisplay = dataPriv.get(elem, "display");
            }
            display = jQuery2.css(elem, "display");
            if (display === "none") {
              if (restoreDisplay) {
                display = restoreDisplay;
              } else {
                showHide([elem], true);
                restoreDisplay = elem.style.display || restoreDisplay;
                display = jQuery2.css(elem, "display");
                showHide([elem]);
              }
            }
            if (display === "inline" || display === "inline-block" && restoreDisplay != null) {
              if (jQuery2.css(elem, "float") === "none") {
                if (!propTween) {
                  anim.done(function() {
                    style.display = restoreDisplay;
                  });
                  if (restoreDisplay == null) {
                    display = style.display;
                    restoreDisplay = display === "none" ? "" : display;
                  }
                }
                style.display = "inline-block";
              }
            }
          }
          if (opts.overflow) {
            style.overflow = "hidden";
            anim.always(function() {
              style.overflow = opts.overflow[0];
              style.overflowX = opts.overflow[1];
              style.overflowY = opts.overflow[2];
            });
          }
          propTween = false;
          for (prop in orig) {
            if (!propTween) {
              if (dataShow) {
                if ("hidden" in dataShow) {
                  hidden = dataShow.hidden;
                }
              } else {
                dataShow = dataPriv.access(elem, "fxshow", { display: restoreDisplay });
              }
              if (toggle) {
                dataShow.hidden = !hidden;
              }
              if (hidden) {
                showHide([elem], true);
              }
              anim.done(function() {
                if (!hidden) {
                  showHide([elem]);
                }
                dataPriv.remove(elem, "fxshow");
                for (prop in orig) {
                  jQuery2.style(elem, prop, orig[prop]);
                }
              });
            }
            propTween = createTween(hidden ? dataShow[prop] : 0, prop, anim);
            if (!(prop in dataShow)) {
              dataShow[prop] = propTween.start;
              if (hidden) {
                propTween.end = propTween.start;
                propTween.start = 0;
              }
            }
          }
        }
        function propFilter(props, specialEasing) {
          var index, name, easing, value, hooks;
          for (index in props) {
            name = camelCase(index);
            easing = specialEasing[name];
            value = props[index];
            if (Array.isArray(value)) {
              easing = value[1];
              value = props[index] = value[0];
            }
            if (index !== name) {
              props[name] = value;
              delete props[index];
            }
            hooks = jQuery2.cssHooks[name];
            if (hooks && "expand" in hooks) {
              value = hooks.expand(value);
              delete props[name];
              for (index in value) {
                if (!(index in props)) {
                  props[index] = value[index];
                  specialEasing[index] = easing;
                }
              }
            } else {
              specialEasing[name] = easing;
            }
          }
        }
        function Animation(elem, properties, options) {
          var result, stopped, index = 0, length = Animation.prefilters.length, deferred = jQuery2.Deferred().always(function() {
            delete tick.elem;
          }), tick = function() {
            if (stopped) {
              return false;
            }
            var currentTime = fxNow || createFxNow(), remaining = Math.max(0, animation.startTime + animation.duration - currentTime), temp = remaining / animation.duration || 0, percent = 1 - temp, index2 = 0, length2 = animation.tweens.length;
            for (; index2 < length2; index2++) {
              animation.tweens[index2].run(percent);
            }
            deferred.notifyWith(elem, [animation, percent, remaining]);
            if (percent < 1 && length2) {
              return remaining;
            }
            if (!length2) {
              deferred.notifyWith(elem, [animation, 1, 0]);
            }
            deferred.resolveWith(elem, [animation]);
            return false;
          }, animation = deferred.promise({
            elem,
            props: jQuery2.extend({}, properties),
            opts: jQuery2.extend(true, {
              specialEasing: {},
              easing: jQuery2.easing._default
            }, options),
            originalProperties: properties,
            originalOptions: options,
            startTime: fxNow || createFxNow(),
            duration: options.duration,
            tweens: [],
            createTween: function(prop, end) {
              var tween = jQuery2.Tween(
                elem,
                animation.opts,
                prop,
                end,
                animation.opts.specialEasing[prop] || animation.opts.easing
              );
              animation.tweens.push(tween);
              return tween;
            },
            stop: function(gotoEnd) {
              var index2 = 0, length2 = gotoEnd ? animation.tweens.length : 0;
              if (stopped) {
                return this;
              }
              stopped = true;
              for (; index2 < length2; index2++) {
                animation.tweens[index2].run(1);
              }
              if (gotoEnd) {
                deferred.notifyWith(elem, [animation, 1, 0]);
                deferred.resolveWith(elem, [animation, gotoEnd]);
              } else {
                deferred.rejectWith(elem, [animation, gotoEnd]);
              }
              return this;
            }
          }), props = animation.props;
          propFilter(props, animation.opts.specialEasing);
          for (; index < length; index++) {
            result = Animation.prefilters[index].call(animation, elem, props, animation.opts);
            if (result) {
              if (isFunction(result.stop)) {
                jQuery2._queueHooks(animation.elem, animation.opts.queue).stop = result.stop.bind(result);
              }
              return result;
            }
          }
          jQuery2.map(props, createTween, animation);
          if (isFunction(animation.opts.start)) {
            animation.opts.start.call(elem, animation);
          }
          animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
          jQuery2.fx.timer(
            jQuery2.extend(tick, {
              elem,
              anim: animation,
              queue: animation.opts.queue
            })
          );
          return animation;
        }
        jQuery2.Animation = jQuery2.extend(Animation, {
          tweeners: {
            "*": [function(prop, value) {
              var tween = this.createTween(prop, value);
              adjustCSS(tween.elem, prop, rcssNum.exec(value), tween);
              return tween;
            }]
          },
          tweener: function(props, callback) {
            if (isFunction(props)) {
              callback = props;
              props = ["*"];
            } else {
              props = props.match(rnothtmlwhite);
            }
            var prop, index = 0, length = props.length;
            for (; index < length; index++) {
              prop = props[index];
              Animation.tweeners[prop] = Animation.tweeners[prop] || [];
              Animation.tweeners[prop].unshift(callback);
            }
          },
          prefilters: [defaultPrefilter],
          prefilter: function(callback, prepend) {
            if (prepend) {
              Animation.prefilters.unshift(callback);
            } else {
              Animation.prefilters.push(callback);
            }
          }
        });
        jQuery2.speed = function(speed, easing, fn) {
          var opt = speed && typeof speed === "object" ? jQuery2.extend({}, speed) : {
            complete: fn || !fn && easing || isFunction(speed) && speed,
            duration: speed,
            easing: fn && easing || easing && !isFunction(easing) && easing
          };
          if (jQuery2.fx.off) {
            opt.duration = 0;
          } else {
            if (typeof opt.duration !== "number") {
              if (opt.duration in jQuery2.fx.speeds) {
                opt.duration = jQuery2.fx.speeds[opt.duration];
              } else {
                opt.duration = jQuery2.fx.speeds._default;
              }
            }
          }
          if (opt.queue == null || opt.queue === true) {
            opt.queue = "fx";
          }
          opt.old = opt.complete;
          opt.complete = function() {
            if (isFunction(opt.old)) {
              opt.old.call(this);
            }
            if (opt.queue) {
              jQuery2.dequeue(this, opt.queue);
            }
          };
          return opt;
        };
        jQuery2.fn.extend({
          fadeTo: function(speed, to, easing, callback) {
            return this.filter(isHiddenWithinTree).css("opacity", 0).show().end().animate({ opacity: to }, speed, easing, callback);
          },
          animate: function(prop, speed, easing, callback) {
            var empty = jQuery2.isEmptyObject(prop), optall = jQuery2.speed(speed, easing, callback), doAnimation = function() {
              var anim = Animation(this, jQuery2.extend({}, prop), optall);
              if (empty || dataPriv.get(this, "finish")) {
                anim.stop(true);
              }
            };
            doAnimation.finish = doAnimation;
            return empty || optall.queue === false ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
          },
          stop: function(type, clearQueue, gotoEnd) {
            var stopQueue = function(hooks) {
              var stop = hooks.stop;
              delete hooks.stop;
              stop(gotoEnd);
            };
            if (typeof type !== "string") {
              gotoEnd = clearQueue;
              clearQueue = type;
              type = void 0;
            }
            if (clearQueue) {
              this.queue(type || "fx", []);
            }
            return this.each(function() {
              var dequeue = true, index = type != null && type + "queueHooks", timers = jQuery2.timers, data = dataPriv.get(this);
              if (index) {
                if (data[index] && data[index].stop) {
                  stopQueue(data[index]);
                }
              } else {
                for (index in data) {
                  if (data[index] && data[index].stop && rrun.test(index)) {
                    stopQueue(data[index]);
                  }
                }
              }
              for (index = timers.length; index--; ) {
                if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
                  timers[index].anim.stop(gotoEnd);
                  dequeue = false;
                  timers.splice(index, 1);
                }
              }
              if (dequeue || !gotoEnd) {
                jQuery2.dequeue(this, type);
              }
            });
          },
          finish: function(type) {
            if (type !== false) {
              type = type || "fx";
            }
            return this.each(function() {
              var index, data = dataPriv.get(this), queue = data[type + "queue"], hooks = data[type + "queueHooks"], timers = jQuery2.timers, length = queue ? queue.length : 0;
              data.finish = true;
              jQuery2.queue(this, type, []);
              if (hooks && hooks.stop) {
                hooks.stop.call(this, true);
              }
              for (index = timers.length; index--; ) {
                if (timers[index].elem === this && timers[index].queue === type) {
                  timers[index].anim.stop(true);
                  timers.splice(index, 1);
                }
              }
              for (index = 0; index < length; index++) {
                if (queue[index] && queue[index].finish) {
                  queue[index].finish.call(this);
                }
              }
              delete data.finish;
            });
          }
        });
        jQuery2.each(["toggle", "show", "hide"], function(_i, name) {
          var cssFn = jQuery2.fn[name];
          jQuery2.fn[name] = function(speed, easing, callback) {
            return speed == null || typeof speed === "boolean" ? cssFn.apply(this, arguments) : this.animate(genFx(name, true), speed, easing, callback);
          };
        });
        jQuery2.each({
          slideDown: genFx("show"),
          slideUp: genFx("hide"),
          slideToggle: genFx("toggle"),
          fadeIn: { opacity: "show" },
          fadeOut: { opacity: "hide" },
          fadeToggle: { opacity: "toggle" }
        }, function(name, props) {
          jQuery2.fn[name] = function(speed, easing, callback) {
            return this.animate(props, speed, easing, callback);
          };
        });
        jQuery2.timers = [];
        jQuery2.fx.tick = function() {
          var timer, i = 0, timers = jQuery2.timers;
          fxNow = Date.now();
          for (; i < timers.length; i++) {
            timer = timers[i];
            if (!timer() && timers[i] === timer) {
              timers.splice(i--, 1);
            }
          }
          if (!timers.length) {
            jQuery2.fx.stop();
          }
          fxNow = void 0;
        };
        jQuery2.fx.timer = function(timer) {
          jQuery2.timers.push(timer);
          jQuery2.fx.start();
        };
        jQuery2.fx.interval = 13;
        jQuery2.fx.start = function() {
          if (inProgress) {
            return;
          }
          inProgress = true;
          schedule();
        };
        jQuery2.fx.stop = function() {
          inProgress = null;
        };
        jQuery2.fx.speeds = {
          slow: 600,
          fast: 200,
          // Default speed
          _default: 400
        };
        jQuery2.fn.delay = function(time, type) {
          time = jQuery2.fx ? jQuery2.fx.speeds[time] || time : time;
          type = type || "fx";
          return this.queue(type, function(next, hooks) {
            var timeout = window2.setTimeout(next, time);
            hooks.stop = function() {
              window2.clearTimeout(timeout);
            };
          });
        };
        (function() {
          var input = document2.createElement("input"), select = document2.createElement("select"), opt = select.appendChild(document2.createElement("option"));
          input.type = "checkbox";
          support.checkOn = input.value !== "";
          support.optSelected = opt.selected;
          input = document2.createElement("input");
          input.value = "t";
          input.type = "radio";
          support.radioValue = input.value === "t";
        })();
        var boolHook, attrHandle = jQuery2.expr.attrHandle;
        jQuery2.fn.extend({
          attr: function(name, value) {
            return access(this, jQuery2.attr, name, value, arguments.length > 1);
          },
          removeAttr: function(name) {
            return this.each(function() {
              jQuery2.removeAttr(this, name);
            });
          }
        });
        jQuery2.extend({
          attr: function(elem, name, value) {
            var ret, hooks, nType = elem.nodeType;
            if (nType === 3 || nType === 8 || nType === 2) {
              return;
            }
            if (typeof elem.getAttribute === "undefined") {
              return jQuery2.prop(elem, name, value);
            }
            if (nType !== 1 || !jQuery2.isXMLDoc(elem)) {
              hooks = jQuery2.attrHooks[name.toLowerCase()] || (jQuery2.expr.match.bool.test(name) ? boolHook : void 0);
            }
            if (value !== void 0) {
              if (value === null) {
                jQuery2.removeAttr(elem, name);
                return;
              }
              if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== void 0) {
                return ret;
              }
              elem.setAttribute(name, value + "");
              return value;
            }
            if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
              return ret;
            }
            ret = jQuery2.find.attr(elem, name);
            return ret == null ? void 0 : ret;
          },
          attrHooks: {
            type: {
              set: function(elem, value) {
                if (!support.radioValue && value === "radio" && nodeName(elem, "input")) {
                  var val = elem.value;
                  elem.setAttribute("type", value);
                  if (val) {
                    elem.value = val;
                  }
                  return value;
                }
              }
            }
          },
          removeAttr: function(elem, value) {
            var name, i = 0, attrNames = value && value.match(rnothtmlwhite);
            if (attrNames && elem.nodeType === 1) {
              while (name = attrNames[i++]) {
                elem.removeAttribute(name);
              }
            }
          }
        });
        boolHook = {
          set: function(elem, value, name) {
            if (value === false) {
              jQuery2.removeAttr(elem, name);
            } else {
              elem.setAttribute(name, name);
            }
            return name;
          }
        };
        jQuery2.each(jQuery2.expr.match.bool.source.match(/\w+/g), function(_i, name) {
          var getter = attrHandle[name] || jQuery2.find.attr;
          attrHandle[name] = function(elem, name2, isXML) {
            var ret, handle, lowercaseName = name2.toLowerCase();
            if (!isXML) {
              handle = attrHandle[lowercaseName];
              attrHandle[lowercaseName] = ret;
              ret = getter(elem, name2, isXML) != null ? lowercaseName : null;
              attrHandle[lowercaseName] = handle;
            }
            return ret;
          };
        });
        var rfocusable = /^(?:input|select|textarea|button)$/i, rclickable = /^(?:a|area)$/i;
        jQuery2.fn.extend({
          prop: function(name, value) {
            return access(this, jQuery2.prop, name, value, arguments.length > 1);
          },
          removeProp: function(name) {
            return this.each(function() {
              delete this[jQuery2.propFix[name] || name];
            });
          }
        });
        jQuery2.extend({
          prop: function(elem, name, value) {
            var ret, hooks, nType = elem.nodeType;
            if (nType === 3 || nType === 8 || nType === 2) {
              return;
            }
            if (nType !== 1 || !jQuery2.isXMLDoc(elem)) {
              name = jQuery2.propFix[name] || name;
              hooks = jQuery2.propHooks[name];
            }
            if (value !== void 0) {
              if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== void 0) {
                return ret;
              }
              return elem[name] = value;
            }
            if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
              return ret;
            }
            return elem[name];
          },
          propHooks: {
            tabIndex: {
              get: function(elem) {
                var tabindex = jQuery2.find.attr(elem, "tabindex");
                if (tabindex) {
                  return parseInt(tabindex, 10);
                }
                if (rfocusable.test(elem.nodeName) || rclickable.test(elem.nodeName) && elem.href) {
                  return 0;
                }
                return -1;
              }
            }
          },
          propFix: {
            "for": "htmlFor",
            "class": "className"
          }
        });
        if (!support.optSelected) {
          jQuery2.propHooks.selected = {
            get: function(elem) {
              var parent = elem.parentNode;
              if (parent && parent.parentNode) {
                parent.parentNode.selectedIndex;
              }
              return null;
            },
            set: function(elem) {
              var parent = elem.parentNode;
              if (parent) {
                parent.selectedIndex;
                if (parent.parentNode) {
                  parent.parentNode.selectedIndex;
                }
              }
            }
          };
        }
        jQuery2.each([
          "tabIndex",
          "readOnly",
          "maxLength",
          "cellSpacing",
          "cellPadding",
          "rowSpan",
          "colSpan",
          "useMap",
          "frameBorder",
          "contentEditable"
        ], function() {
          jQuery2.propFix[this.toLowerCase()] = this;
        });
        function stripAndCollapse(value) {
          var tokens = value.match(rnothtmlwhite) || [];
          return tokens.join(" ");
        }
        function getClass(elem) {
          return elem.getAttribute && elem.getAttribute("class") || "";
        }
        function classesToArray(value) {
          if (Array.isArray(value)) {
            return value;
          }
          if (typeof value === "string") {
            return value.match(rnothtmlwhite) || [];
          }
          return [];
        }
        jQuery2.fn.extend({
          addClass: function(value) {
            var classNames, cur, curValue, className, i, finalValue;
            if (isFunction(value)) {
              return this.each(function(j) {
                jQuery2(this).addClass(value.call(this, j, getClass(this)));
              });
            }
            classNames = classesToArray(value);
            if (classNames.length) {
              return this.each(function() {
                curValue = getClass(this);
                cur = this.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
                if (cur) {
                  for (i = 0; i < classNames.length; i++) {
                    className = classNames[i];
                    if (cur.indexOf(" " + className + " ") < 0) {
                      cur += className + " ";
                    }
                  }
                  finalValue = stripAndCollapse(cur);
                  if (curValue !== finalValue) {
                    this.setAttribute("class", finalValue);
                  }
                }
              });
            }
            return this;
          },
          removeClass: function(value) {
            var classNames, cur, curValue, className, i, finalValue;
            if (isFunction(value)) {
              return this.each(function(j) {
                jQuery2(this).removeClass(value.call(this, j, getClass(this)));
              });
            }
            if (!arguments.length) {
              return this.attr("class", "");
            }
            classNames = classesToArray(value);
            if (classNames.length) {
              return this.each(function() {
                curValue = getClass(this);
                cur = this.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
                if (cur) {
                  for (i = 0; i < classNames.length; i++) {
                    className = classNames[i];
                    while (cur.indexOf(" " + className + " ") > -1) {
                      cur = cur.replace(" " + className + " ", " ");
                    }
                  }
                  finalValue = stripAndCollapse(cur);
                  if (curValue !== finalValue) {
                    this.setAttribute("class", finalValue);
                  }
                }
              });
            }
            return this;
          },
          toggleClass: function(value, stateVal) {
            var classNames, className, i, self, type = typeof value, isValidValue = type === "string" || Array.isArray(value);
            if (isFunction(value)) {
              return this.each(function(i2) {
                jQuery2(this).toggleClass(
                  value.call(this, i2, getClass(this), stateVal),
                  stateVal
                );
              });
            }
            if (typeof stateVal === "boolean" && isValidValue) {
              return stateVal ? this.addClass(value) : this.removeClass(value);
            }
            classNames = classesToArray(value);
            return this.each(function() {
              if (isValidValue) {
                self = jQuery2(this);
                for (i = 0; i < classNames.length; i++) {
                  className = classNames[i];
                  if (self.hasClass(className)) {
                    self.removeClass(className);
                  } else {
                    self.addClass(className);
                  }
                }
              } else if (value === void 0 || type === "boolean") {
                className = getClass(this);
                if (className) {
                  dataPriv.set(this, "__className__", className);
                }
                if (this.setAttribute) {
                  this.setAttribute(
                    "class",
                    className || value === false ? "" : dataPriv.get(this, "__className__") || ""
                  );
                }
              }
            });
          },
          hasClass: function(selector) {
            var className, elem, i = 0;
            className = " " + selector + " ";
            while (elem = this[i++]) {
              if (elem.nodeType === 1 && (" " + stripAndCollapse(getClass(elem)) + " ").indexOf(className) > -1) {
                return true;
              }
            }
            return false;
          }
        });
        var rreturn = /\r/g;
        jQuery2.fn.extend({
          val: function(value) {
            var hooks, ret, valueIsFunction, elem = this[0];
            if (!arguments.length) {
              if (elem) {
                hooks = jQuery2.valHooks[elem.type] || jQuery2.valHooks[elem.nodeName.toLowerCase()];
                if (hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== void 0) {
                  return ret;
                }
                ret = elem.value;
                if (typeof ret === "string") {
                  return ret.replace(rreturn, "");
                }
                return ret == null ? "" : ret;
              }
              return;
            }
            valueIsFunction = isFunction(value);
            return this.each(function(i) {
              var val;
              if (this.nodeType !== 1) {
                return;
              }
              if (valueIsFunction) {
                val = value.call(this, i, jQuery2(this).val());
              } else {
                val = value;
              }
              if (val == null) {
                val = "";
              } else if (typeof val === "number") {
                val += "";
              } else if (Array.isArray(val)) {
                val = jQuery2.map(val, function(value2) {
                  return value2 == null ? "" : value2 + "";
                });
              }
              hooks = jQuery2.valHooks[this.type] || jQuery2.valHooks[this.nodeName.toLowerCase()];
              if (!hooks || !("set" in hooks) || hooks.set(this, val, "value") === void 0) {
                this.value = val;
              }
            });
          }
        });
        jQuery2.extend({
          valHooks: {
            option: {
              get: function(elem) {
                var val = jQuery2.find.attr(elem, "value");
                return val != null ? val : (
                  // Support: IE <=10 - 11 only
                  // option.text throws exceptions (trac-14686, trac-14858)
                  // Strip and collapse whitespace
                  // https://html.spec.whatwg.org/#strip-and-collapse-whitespace
                  stripAndCollapse(jQuery2.text(elem))
                );
              }
            },
            select: {
              get: function(elem) {
                var value, option, i, options = elem.options, index = elem.selectedIndex, one = elem.type === "select-one", values = one ? null : [], max = one ? index + 1 : options.length;
                if (index < 0) {
                  i = max;
                } else {
                  i = one ? index : 0;
                }
                for (; i < max; i++) {
                  option = options[i];
                  if ((option.selected || i === index) && // Don't return options that are disabled or in a disabled optgroup
                  !option.disabled && (!option.parentNode.disabled || !nodeName(option.parentNode, "optgroup"))) {
                    value = jQuery2(option).val();
                    if (one) {
                      return value;
                    }
                    values.push(value);
                  }
                }
                return values;
              },
              set: function(elem, value) {
                var optionSet, option, options = elem.options, values = jQuery2.makeArray(value), i = options.length;
                while (i--) {
                  option = options[i];
                  if (option.selected = jQuery2.inArray(jQuery2.valHooks.option.get(option), values) > -1) {
                    optionSet = true;
                  }
                }
                if (!optionSet) {
                  elem.selectedIndex = -1;
                }
                return values;
              }
            }
          }
        });
        jQuery2.each(["radio", "checkbox"], function() {
          jQuery2.valHooks[this] = {
            set: function(elem, value) {
              if (Array.isArray(value)) {
                return elem.checked = jQuery2.inArray(jQuery2(elem).val(), value) > -1;
              }
            }
          };
          if (!support.checkOn) {
            jQuery2.valHooks[this].get = function(elem) {
              return elem.getAttribute("value") === null ? "on" : elem.value;
            };
          }
        });
        var location = window2.location;
        var nonce = { guid: Date.now() };
        var rquery = /\?/;
        jQuery2.parseXML = function(data) {
          var xml, parserErrorElem;
          if (!data || typeof data !== "string") {
            return null;
          }
          try {
            xml = new window2.DOMParser().parseFromString(data, "text/xml");
          } catch (e) {
          }
          parserErrorElem = xml && xml.getElementsByTagName("parsererror")[0];
          if (!xml || parserErrorElem) {
            jQuery2.error("Invalid XML: " + (parserErrorElem ? jQuery2.map(parserErrorElem.childNodes, function(el) {
              return el.textContent;
            }).join("\n") : data));
          }
          return xml;
        };
        var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/, stopPropagationCallback = function(e) {
          e.stopPropagation();
        };
        jQuery2.extend(jQuery2.event, {
          trigger: function(event, data, elem, onlyHandlers) {
            var i, cur, tmp, bubbleType, ontype, handle, special, lastElement, eventPath = [elem || document2], type = hasOwn.call(event, "type") ? event.type : event, namespaces = hasOwn.call(event, "namespace") ? event.namespace.split(".") : [];
            cur = lastElement = tmp = elem = elem || document2;
            if (elem.nodeType === 3 || elem.nodeType === 8) {
              return;
            }
            if (rfocusMorph.test(type + jQuery2.event.triggered)) {
              return;
            }
            if (type.indexOf(".") > -1) {
              namespaces = type.split(".");
              type = namespaces.shift();
              namespaces.sort();
            }
            ontype = type.indexOf(":") < 0 && "on" + type;
            event = event[jQuery2.expando] ? event : new jQuery2.Event(type, typeof event === "object" && event);
            event.isTrigger = onlyHandlers ? 2 : 3;
            event.namespace = namespaces.join(".");
            event.rnamespace = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
            event.result = void 0;
            if (!event.target) {
              event.target = elem;
            }
            data = data == null ? [event] : jQuery2.makeArray(data, [event]);
            special = jQuery2.event.special[type] || {};
            if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) {
              return;
            }
            if (!onlyHandlers && !special.noBubble && !isWindow(elem)) {
              bubbleType = special.delegateType || type;
              if (!rfocusMorph.test(bubbleType + type)) {
                cur = cur.parentNode;
              }
              for (; cur; cur = cur.parentNode) {
                eventPath.push(cur);
                tmp = cur;
              }
              if (tmp === (elem.ownerDocument || document2)) {
                eventPath.push(tmp.defaultView || tmp.parentWindow || window2);
              }
            }
            i = 0;
            while ((cur = eventPath[i++]) && !event.isPropagationStopped()) {
              lastElement = cur;
              event.type = i > 1 ? bubbleType : special.bindType || type;
              handle = (dataPriv.get(cur, "events") || /* @__PURE__ */ Object.create(null))[event.type] && dataPriv.get(cur, "handle");
              if (handle) {
                handle.apply(cur, data);
              }
              handle = ontype && cur[ontype];
              if (handle && handle.apply && acceptData(cur)) {
                event.result = handle.apply(cur, data);
                if (event.result === false) {
                  event.preventDefault();
                }
              }
            }
            event.type = type;
            if (!onlyHandlers && !event.isDefaultPrevented()) {
              if ((!special._default || special._default.apply(eventPath.pop(), data) === false) && acceptData(elem)) {
                if (ontype && isFunction(elem[type]) && !isWindow(elem)) {
                  tmp = elem[ontype];
                  if (tmp) {
                    elem[ontype] = null;
                  }
                  jQuery2.event.triggered = type;
                  if (event.isPropagationStopped()) {
                    lastElement.addEventListener(type, stopPropagationCallback);
                  }
                  elem[type]();
                  if (event.isPropagationStopped()) {
                    lastElement.removeEventListener(type, stopPropagationCallback);
                  }
                  jQuery2.event.triggered = void 0;
                  if (tmp) {
                    elem[ontype] = tmp;
                  }
                }
              }
            }
            return event.result;
          },
          // Piggyback on a donor event to simulate a different one
          // Used only for `focus(in | out)` events
          simulate: function(type, elem, event) {
            var e = jQuery2.extend(
              new jQuery2.Event(),
              event,
              {
                type,
                isSimulated: true
              }
            );
            jQuery2.event.trigger(e, null, elem);
          }
        });
        jQuery2.fn.extend({
          trigger: function(type, data) {
            return this.each(function() {
              jQuery2.event.trigger(type, data, this);
            });
          },
          triggerHandler: function(type, data) {
            var elem = this[0];
            if (elem) {
              return jQuery2.event.trigger(type, data, elem, true);
            }
          }
        });
        var rbracket = /\[\]$/, rCRLF = /\r?\n/g, rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i, rsubmittable = /^(?:input|select|textarea|keygen)/i;
        function buildParams(prefix, obj, traditional, add) {
          var name;
          if (Array.isArray(obj)) {
            jQuery2.each(obj, function(i, v) {
              if (traditional || rbracket.test(prefix)) {
                add(prefix, v);
              } else {
                buildParams(
                  prefix + "[" + (typeof v === "object" && v != null ? i : "") + "]",
                  v,
                  traditional,
                  add
                );
              }
            });
          } else if (!traditional && toType(obj) === "object") {
            for (name in obj) {
              buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
            }
          } else {
            add(prefix, obj);
          }
        }
        jQuery2.param = function(a, traditional) {
          var prefix, s = [], add = function(key, valueOrFunction) {
            var value = isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction;
            s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value);
          };
          if (a == null) {
            return "";
          }
          if (Array.isArray(a) || a.jquery && !jQuery2.isPlainObject(a)) {
            jQuery2.each(a, function() {
              add(this.name, this.value);
            });
          } else {
            for (prefix in a) {
              buildParams(prefix, a[prefix], traditional, add);
            }
          }
          return s.join("&");
        };
        jQuery2.fn.extend({
          serialize: function() {
            return jQuery2.param(this.serializeArray());
          },
          serializeArray: function() {
            return this.map(function() {
              var elements = jQuery2.prop(this, "elements");
              return elements ? jQuery2.makeArray(elements) : this;
            }).filter(function() {
              var type = this.type;
              return this.name && !jQuery2(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type));
            }).map(function(_i, elem) {
              var val = jQuery2(this).val();
              if (val == null) {
                return null;
              }
              if (Array.isArray(val)) {
                return jQuery2.map(val, function(val2) {
                  return { name: elem.name, value: val2.replace(rCRLF, "\r\n") };
                });
              }
              return { name: elem.name, value: val.replace(rCRLF, "\r\n") };
            }).get();
          }
        });
        var r20 = /%20/g, rhash = /#.*$/, rantiCache = /([?&])_=[^&]*/, rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg, rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/, rnoContent = /^(?:GET|HEAD)$/, rprotocol = /^\/\//, prefilters = {}, transports = {}, allTypes = "*/".concat("*"), originAnchor = document2.createElement("a");
        originAnchor.href = location.href;
        function addToPrefiltersOrTransports(structure) {
          return function(dataTypeExpression, func) {
            if (typeof dataTypeExpression !== "string") {
              func = dataTypeExpression;
              dataTypeExpression = "*";
            }
            var dataType, i = 0, dataTypes = dataTypeExpression.toLowerCase().match(rnothtmlwhite) || [];
            if (isFunction(func)) {
              while (dataType = dataTypes[i++]) {
                if (dataType[0] === "+") {
                  dataType = dataType.slice(1) || "*";
                  (structure[dataType] = structure[dataType] || []).unshift(func);
                } else {
                  (structure[dataType] = structure[dataType] || []).push(func);
                }
              }
            }
          };
        }
        function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {
          var inspected = {}, seekingTransport = structure === transports;
          function inspect(dataType) {
            var selected;
            inspected[dataType] = true;
            jQuery2.each(structure[dataType] || [], function(_, prefilterOrFactory) {
              var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);
              if (typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]) {
                options.dataTypes.unshift(dataTypeOrTransport);
                inspect(dataTypeOrTransport);
                return false;
              } else if (seekingTransport) {
                return !(selected = dataTypeOrTransport);
              }
            });
            return selected;
          }
          return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");
        }
        function ajaxExtend(target, src) {
          var key, deep, flatOptions = jQuery2.ajaxSettings.flatOptions || {};
          for (key in src) {
            if (src[key] !== void 0) {
              (flatOptions[key] ? target : deep || (deep = {}))[key] = src[key];
            }
          }
          if (deep) {
            jQuery2.extend(true, target, deep);
          }
          return target;
        }
        function ajaxHandleResponses(s, jqXHR, responses) {
          var ct, type, finalDataType, firstDataType, contents = s.contents, dataTypes = s.dataTypes;
          while (dataTypes[0] === "*") {
            dataTypes.shift();
            if (ct === void 0) {
              ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
            }
          }
          if (ct) {
            for (type in contents) {
              if (contents[type] && contents[type].test(ct)) {
                dataTypes.unshift(type);
                break;
              }
            }
          }
          if (dataTypes[0] in responses) {
            finalDataType = dataTypes[0];
          } else {
            for (type in responses) {
              if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
                finalDataType = type;
                break;
              }
              if (!firstDataType) {
                firstDataType = type;
              }
            }
            finalDataType = finalDataType || firstDataType;
          }
          if (finalDataType) {
            if (finalDataType !== dataTypes[0]) {
              dataTypes.unshift(finalDataType);
            }
            return responses[finalDataType];
          }
        }
        function ajaxConvert(s, response, jqXHR, isSuccess) {
          var conv2, current, conv, tmp, prev, converters = {}, dataTypes = s.dataTypes.slice();
          if (dataTypes[1]) {
            for (conv in s.converters) {
              converters[conv.toLowerCase()] = s.converters[conv];
            }
          }
          current = dataTypes.shift();
          while (current) {
            if (s.responseFields[current]) {
              jqXHR[s.responseFields[current]] = response;
            }
            if (!prev && isSuccess && s.dataFilter) {
              response = s.dataFilter(response, s.dataType);
            }
            prev = current;
            current = dataTypes.shift();
            if (current) {
              if (current === "*") {
                current = prev;
              } else if (prev !== "*" && prev !== current) {
                conv = converters[prev + " " + current] || converters["* " + current];
                if (!conv) {
                  for (conv2 in converters) {
                    tmp = conv2.split(" ");
                    if (tmp[1] === current) {
                      conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];
                      if (conv) {
                        if (conv === true) {
                          conv = converters[conv2];
                        } else if (converters[conv2] !== true) {
                          current = tmp[0];
                          dataTypes.unshift(tmp[1]);
                        }
                        break;
                      }
                    }
                  }
                }
                if (conv !== true) {
                  if (conv && s.throws) {
                    response = conv(response);
                  } else {
                    try {
                      response = conv(response);
                    } catch (e) {
                      return {
                        state: "parsererror",
                        error: conv ? e : "No conversion from " + prev + " to " + current
                      };
                    }
                  }
                }
              }
            }
          }
          return { state: "success", data: response };
        }
        jQuery2.extend({
          // Counter for holding the number of active queries
          active: 0,
          // Last-Modified header cache for next request
          lastModified: {},
          etag: {},
          ajaxSettings: {
            url: location.href,
            type: "GET",
            isLocal: rlocalProtocol.test(location.protocol),
            global: true,
            processData: true,
            async: true,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            /*
            timeout: 0,
            data: null,
            dataType: null,
            username: null,
            password: null,
            cache: null,
            throws: false,
            traditional: false,
            headers: {},
            */
            accepts: {
              "*": allTypes,
              text: "text/plain",
              html: "text/html",
              xml: "application/xml, text/xml",
              json: "application/json, text/javascript"
            },
            contents: {
              xml: /\bxml\b/,
              html: /\bhtml/,
              json: /\bjson\b/
            },
            responseFields: {
              xml: "responseXML",
              text: "responseText",
              json: "responseJSON"
            },
            // Data converters
            // Keys separate source (or catchall "*") and destination types with a single space
            converters: {
              // Convert anything to text
              "* text": String,
              // Text to html (true = no transformation)
              "text html": true,
              // Evaluate text as a json expression
              "text json": JSON.parse,
              // Parse text as xml
              "text xml": jQuery2.parseXML
            },
            // For options that shouldn't be deep extended:
            // you can add your own custom options here if
            // and when you create one that shouldn't be
            // deep extended (see ajaxExtend)
            flatOptions: {
              url: true,
              context: true
            }
          },
          // Creates a full fledged settings object into target
          // with both ajaxSettings and settings fields.
          // If target is omitted, writes into ajaxSettings.
          ajaxSetup: function(target, settings) {
            return settings ? (
              // Building a settings object
              ajaxExtend(ajaxExtend(target, jQuery2.ajaxSettings), settings)
            ) : (
              // Extending ajaxSettings
              ajaxExtend(jQuery2.ajaxSettings, target)
            );
          },
          ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
          ajaxTransport: addToPrefiltersOrTransports(transports),
          // Main method
          ajax: function(url, options) {
            if (typeof url === "object") {
              options = url;
              url = void 0;
            }
            options = options || {};
            var transport, cacheURL, responseHeadersString, responseHeaders, timeoutTimer, urlAnchor, completed2, fireGlobals, i, uncached, s = jQuery2.ajaxSetup({}, options), callbackContext = s.context || s, globalEventContext = s.context && (callbackContext.nodeType || callbackContext.jquery) ? jQuery2(callbackContext) : jQuery2.event, deferred = jQuery2.Deferred(), completeDeferred = jQuery2.Callbacks("once memory"), statusCode = s.statusCode || {}, requestHeaders = {}, requestHeadersNames = {}, strAbort = "canceled", jqXHR = {
              readyState: 0,
              // Builds headers hashtable if needed
              getResponseHeader: function(key) {
                var match;
                if (completed2) {
                  if (!responseHeaders) {
                    responseHeaders = {};
                    while (match = rheaders.exec(responseHeadersString)) {
                      responseHeaders[match[1].toLowerCase() + " "] = (responseHeaders[match[1].toLowerCase() + " "] || []).concat(match[2]);
                    }
                  }
                  match = responseHeaders[key.toLowerCase() + " "];
                }
                return match == null ? null : match.join(", ");
              },
              // Raw string
              getAllResponseHeaders: function() {
                return completed2 ? responseHeadersString : null;
              },
              // Caches the header
              setRequestHeader: function(name, value) {
                if (completed2 == null) {
                  name = requestHeadersNames[name.toLowerCase()] = requestHeadersNames[name.toLowerCase()] || name;
                  requestHeaders[name] = value;
                }
                return this;
              },
              // Overrides response content-type header
              overrideMimeType: function(type) {
                if (completed2 == null) {
                  s.mimeType = type;
                }
                return this;
              },
              // Status-dependent callbacks
              statusCode: function(map) {
                var code;
                if (map) {
                  if (completed2) {
                    jqXHR.always(map[jqXHR.status]);
                  } else {
                    for (code in map) {
                      statusCode[code] = [statusCode[code], map[code]];
                    }
                  }
                }
                return this;
              },
              // Cancel the request
              abort: function(statusText) {
                var finalText = statusText || strAbort;
                if (transport) {
                  transport.abort(finalText);
                }
                done(0, finalText);
                return this;
              }
            };
            deferred.promise(jqXHR);
            s.url = ((url || s.url || location.href) + "").replace(rprotocol, location.protocol + "//");
            s.type = options.method || options.type || s.method || s.type;
            s.dataTypes = (s.dataType || "*").toLowerCase().match(rnothtmlwhite) || [""];
            if (s.crossDomain == null) {
              urlAnchor = document2.createElement("a");
              try {
                urlAnchor.href = s.url;
                urlAnchor.href = urlAnchor.href;
                s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !== urlAnchor.protocol + "//" + urlAnchor.host;
              } catch (e) {
                s.crossDomain = true;
              }
            }
            if (s.data && s.processData && typeof s.data !== "string") {
              s.data = jQuery2.param(s.data, s.traditional);
            }
            inspectPrefiltersOrTransports(prefilters, s, options, jqXHR);
            if (completed2) {
              return jqXHR;
            }
            fireGlobals = jQuery2.event && s.global;
            if (fireGlobals && jQuery2.active++ === 0) {
              jQuery2.event.trigger("ajaxStart");
            }
            s.type = s.type.toUpperCase();
            s.hasContent = !rnoContent.test(s.type);
            cacheURL = s.url.replace(rhash, "");
            if (!s.hasContent) {
              uncached = s.url.slice(cacheURL.length);
              if (s.data && (s.processData || typeof s.data === "string")) {
                cacheURL += (rquery.test(cacheURL) ? "&" : "?") + s.data;
                delete s.data;
              }
              if (s.cache === false) {
                cacheURL = cacheURL.replace(rantiCache, "$1");
                uncached = (rquery.test(cacheURL) ? "&" : "?") + "_=" + nonce.guid++ + uncached;
              }
              s.url = cacheURL + uncached;
            } else if (s.data && s.processData && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0) {
              s.data = s.data.replace(r20, "+");
            }
            if (s.ifModified) {
              if (jQuery2.lastModified[cacheURL]) {
                jqXHR.setRequestHeader("If-Modified-Since", jQuery2.lastModified[cacheURL]);
              }
              if (jQuery2.etag[cacheURL]) {
                jqXHR.setRequestHeader("If-None-Match", jQuery2.etag[cacheURL]);
              }
            }
            if (s.data && s.hasContent && s.contentType !== false || options.contentType) {
              jqXHR.setRequestHeader("Content-Type", s.contentType);
            }
            jqXHR.setRequestHeader(
              "Accept",
              s.dataTypes[0] && s.accepts[s.dataTypes[0]] ? s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*" ? ", " + allTypes + "; q=0.01" : "") : s.accepts["*"]
            );
            for (i in s.headers) {
              jqXHR.setRequestHeader(i, s.headers[i]);
            }
            if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || completed2)) {
              return jqXHR.abort();
            }
            strAbort = "abort";
            completeDeferred.add(s.complete);
            jqXHR.done(s.success);
            jqXHR.fail(s.error);
            transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR);
            if (!transport) {
              done(-1, "No Transport");
            } else {
              jqXHR.readyState = 1;
              if (fireGlobals) {
                globalEventContext.trigger("ajaxSend", [jqXHR, s]);
              }
              if (completed2) {
                return jqXHR;
              }
              if (s.async && s.timeout > 0) {
                timeoutTimer = window2.setTimeout(function() {
                  jqXHR.abort("timeout");
                }, s.timeout);
              }
              try {
                completed2 = false;
                transport.send(requestHeaders, done);
              } catch (e) {
                if (completed2) {
                  throw e;
                }
                done(-1, e);
              }
            }
            function done(status, nativeStatusText, responses, headers) {
              var isSuccess, success, error, response, modified, statusText = nativeStatusText;
              if (completed2) {
                return;
              }
              completed2 = true;
              if (timeoutTimer) {
                window2.clearTimeout(timeoutTimer);
              }
              transport = void 0;
              responseHeadersString = headers || "";
              jqXHR.readyState = status > 0 ? 4 : 0;
              isSuccess = status >= 200 && status < 300 || status === 304;
              if (responses) {
                response = ajaxHandleResponses(s, jqXHR, responses);
              }
              if (!isSuccess && jQuery2.inArray("script", s.dataTypes) > -1 && jQuery2.inArray("json", s.dataTypes) < 0) {
                s.converters["text script"] = function() {
                };
              }
              response = ajaxConvert(s, response, jqXHR, isSuccess);
              if (isSuccess) {
                if (s.ifModified) {
                  modified = jqXHR.getResponseHeader("Last-Modified");
                  if (modified) {
                    jQuery2.lastModified[cacheURL] = modified;
                  }
                  modified = jqXHR.getResponseHeader("etag");
                  if (modified) {
                    jQuery2.etag[cacheURL] = modified;
                  }
                }
                if (status === 204 || s.type === "HEAD") {
                  statusText = "nocontent";
                } else if (status === 304) {
                  statusText = "notmodified";
                } else {
                  statusText = response.state;
                  success = response.data;
                  error = response.error;
                  isSuccess = !error;
                }
              } else {
                error = statusText;
                if (status || !statusText) {
                  statusText = "error";
                  if (status < 0) {
                    status = 0;
                  }
                }
              }
              jqXHR.status = status;
              jqXHR.statusText = (nativeStatusText || statusText) + "";
              if (isSuccess) {
                deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);
              } else {
                deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);
              }
              jqXHR.statusCode(statusCode);
              statusCode = void 0;
              if (fireGlobals) {
                globalEventContext.trigger(
                  isSuccess ? "ajaxSuccess" : "ajaxError",
                  [jqXHR, s, isSuccess ? success : error]
                );
              }
              completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);
              if (fireGlobals) {
                globalEventContext.trigger("ajaxComplete", [jqXHR, s]);
                if (!--jQuery2.active) {
                  jQuery2.event.trigger("ajaxStop");
                }
              }
            }
            return jqXHR;
          },
          getJSON: function(url, data, callback) {
            return jQuery2.get(url, data, callback, "json");
          },
          getScript: function(url, callback) {
            return jQuery2.get(url, void 0, callback, "script");
          }
        });
        jQuery2.each(["get", "post"], function(_i, method) {
          jQuery2[method] = function(url, data, callback, type) {
            if (isFunction(data)) {
              type = type || callback;
              callback = data;
              data = void 0;
            }
            return jQuery2.ajax(jQuery2.extend({
              url,
              type: method,
              dataType: type,
              data,
              success: callback
            }, jQuery2.isPlainObject(url) && url));
          };
        });
        jQuery2.ajaxPrefilter(function(s) {
          var i;
          for (i in s.headers) {
            if (i.toLowerCase() === "content-type") {
              s.contentType = s.headers[i] || "";
            }
          }
        });
        jQuery2._evalUrl = function(url, options, doc) {
          return jQuery2.ajax({
            url,
            // Make this explicit, since user can override this through ajaxSetup (trac-11264)
            type: "GET",
            dataType: "script",
            cache: true,
            async: false,
            global: false,
            // Only evaluate the response if it is successful (gh-4126)
            // dataFilter is not invoked for failure responses, so using it instead
            // of the default converter is kludgy but it works.
            converters: {
              "text script": function() {
              }
            },
            dataFilter: function(response) {
              jQuery2.globalEval(response, options, doc);
            }
          });
        };
        jQuery2.fn.extend({
          wrapAll: function(html) {
            var wrap;
            if (this[0]) {
              if (isFunction(html)) {
                html = html.call(this[0]);
              }
              wrap = jQuery2(html, this[0].ownerDocument).eq(0).clone(true);
              if (this[0].parentNode) {
                wrap.insertBefore(this[0]);
              }
              wrap.map(function() {
                var elem = this;
                while (elem.firstElementChild) {
                  elem = elem.firstElementChild;
                }
                return elem;
              }).append(this);
            }
            return this;
          },
          wrapInner: function(html) {
            if (isFunction(html)) {
              return this.each(function(i) {
                jQuery2(this).wrapInner(html.call(this, i));
              });
            }
            return this.each(function() {
              var self = jQuery2(this), contents = self.contents();
              if (contents.length) {
                contents.wrapAll(html);
              } else {
                self.append(html);
              }
            });
          },
          wrap: function(html) {
            var htmlIsFunction = isFunction(html);
            return this.each(function(i) {
              jQuery2(this).wrapAll(htmlIsFunction ? html.call(this, i) : html);
            });
          },
          unwrap: function(selector) {
            this.parent(selector).not("body").each(function() {
              jQuery2(this).replaceWith(this.childNodes);
            });
            return this;
          }
        });
        jQuery2.expr.pseudos.hidden = function(elem) {
          return !jQuery2.expr.pseudos.visible(elem);
        };
        jQuery2.expr.pseudos.visible = function(elem) {
          return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
        };
        jQuery2.ajaxSettings.xhr = function() {
          try {
            return new window2.XMLHttpRequest();
          } catch (e) {
          }
        };
        var xhrSuccessStatus = {
          // File protocol always yields status code 0, assume 200
          0: 200,
          // Support: IE <=9 only
          // trac-1450: sometimes IE returns 1223 when it should be 204
          1223: 204
        }, xhrSupported = jQuery2.ajaxSettings.xhr();
        support.cors = !!xhrSupported && "withCredentials" in xhrSupported;
        support.ajax = xhrSupported = !!xhrSupported;
        jQuery2.ajaxTransport(function(options) {
          var callback, errorCallback;
          if (support.cors || xhrSupported && !options.crossDomain) {
            return {
              send: function(headers, complete) {
                var i, xhr = options.xhr();
                xhr.open(
                  options.type,
                  options.url,
                  options.async,
                  options.username,
                  options.password
                );
                if (options.xhrFields) {
                  for (i in options.xhrFields) {
                    xhr[i] = options.xhrFields[i];
                  }
                }
                if (options.mimeType && xhr.overrideMimeType) {
                  xhr.overrideMimeType(options.mimeType);
                }
                if (!options.crossDomain && !headers["X-Requested-With"]) {
                  headers["X-Requested-With"] = "XMLHttpRequest";
                }
                for (i in headers) {
                  xhr.setRequestHeader(i, headers[i]);
                }
                callback = function(type) {
                  return function() {
                    if (callback) {
                      callback = errorCallback = xhr.onload = xhr.onerror = xhr.onabort = xhr.ontimeout = xhr.onreadystatechange = null;
                      if (type === "abort") {
                        xhr.abort();
                      } else if (type === "error") {
                        if (typeof xhr.status !== "number") {
                          complete(0, "error");
                        } else {
                          complete(
                            // File: protocol always yields status 0; see trac-8605, trac-14207
                            xhr.status,
                            xhr.statusText
                          );
                        }
                      } else {
                        complete(
                          xhrSuccessStatus[xhr.status] || xhr.status,
                          xhr.statusText,
                          // Support: IE <=9 only
                          // IE9 has no XHR2 but throws on binary (trac-11426)
                          // For XHR2 non-text, let the caller handle it (gh-2498)
                          (xhr.responseType || "text") !== "text" || typeof xhr.responseText !== "string" ? { binary: xhr.response } : { text: xhr.responseText },
                          xhr.getAllResponseHeaders()
                        );
                      }
                    }
                  };
                };
                xhr.onload = callback();
                errorCallback = xhr.onerror = xhr.ontimeout = callback("error");
                if (xhr.onabort !== void 0) {
                  xhr.onabort = errorCallback;
                } else {
                  xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                      window2.setTimeout(function() {
                        if (callback) {
                          errorCallback();
                        }
                      });
                    }
                  };
                }
                callback = callback("abort");
                try {
                  xhr.send(options.hasContent && options.data || null);
                } catch (e) {
                  if (callback) {
                    throw e;
                  }
                }
              },
              abort: function() {
                if (callback) {
                  callback();
                }
              }
            };
          }
        });
        jQuery2.ajaxPrefilter(function(s) {
          if (s.crossDomain) {
            s.contents.script = false;
          }
        });
        jQuery2.ajaxSetup({
          accepts: {
            script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
          },
          contents: {
            script: /\b(?:java|ecma)script\b/
          },
          converters: {
            "text script": function(text) {
              jQuery2.globalEval(text);
              return text;
            }
          }
        });
        jQuery2.ajaxPrefilter("script", function(s) {
          if (s.cache === void 0) {
            s.cache = false;
          }
          if (s.crossDomain) {
            s.type = "GET";
          }
        });
        jQuery2.ajaxTransport("script", function(s) {
          if (s.crossDomain || s.scriptAttrs) {
            var script, callback;
            return {
              send: function(_, complete) {
                script = jQuery2("<script>").attr(s.scriptAttrs || {}).prop({ charset: s.scriptCharset, src: s.url }).on("load error", callback = function(evt) {
                  script.remove();
                  callback = null;
                  if (evt) {
                    complete(evt.type === "error" ? 404 : 200, evt.type);
                  }
                });
                document2.head.appendChild(script[0]);
              },
              abort: function() {
                if (callback) {
                  callback();
                }
              }
            };
          }
        });
        var oldCallbacks = [], rjsonp = /(=)\?(?=&|$)|\?\?/;
        jQuery2.ajaxSetup({
          jsonp: "callback",
          jsonpCallback: function() {
            var callback = oldCallbacks.pop() || jQuery2.expando + "_" + nonce.guid++;
            this[callback] = true;
            return callback;
          }
        });
        jQuery2.ajaxPrefilter("json jsonp", function(s, originalSettings, jqXHR) {
          var callbackName, overwritten, responseContainer, jsonProp = s.jsonp !== false && (rjsonp.test(s.url) ? "url" : typeof s.data === "string" && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0 && rjsonp.test(s.data) && "data");
          if (jsonProp || s.dataTypes[0] === "jsonp") {
            callbackName = s.jsonpCallback = isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback;
            if (jsonProp) {
              s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName);
            } else if (s.jsonp !== false) {
              s.url += (rquery.test(s.url) ? "&" : "?") + s.jsonp + "=" + callbackName;
            }
            s.converters["script json"] = function() {
              if (!responseContainer) {
                jQuery2.error(callbackName + " was not called");
              }
              return responseContainer[0];
            };
            s.dataTypes[0] = "json";
            overwritten = window2[callbackName];
            window2[callbackName] = function() {
              responseContainer = arguments;
            };
            jqXHR.always(function() {
              if (overwritten === void 0) {
                jQuery2(window2).removeProp(callbackName);
              } else {
                window2[callbackName] = overwritten;
              }
              if (s[callbackName]) {
                s.jsonpCallback = originalSettings.jsonpCallback;
                oldCallbacks.push(callbackName);
              }
              if (responseContainer && isFunction(overwritten)) {
                overwritten(responseContainer[0]);
              }
              responseContainer = overwritten = void 0;
            });
            return "script";
          }
        });
        support.createHTMLDocument = (function() {
          var body = document2.implementation.createHTMLDocument("").body;
          body.innerHTML = "<form></form><form></form>";
          return body.childNodes.length === 2;
        })();
        jQuery2.parseHTML = function(data, context, keepScripts) {
          if (typeof data !== "string") {
            return [];
          }
          if (typeof context === "boolean") {
            keepScripts = context;
            context = false;
          }
          var base, parsed, scripts;
          if (!context) {
            if (support.createHTMLDocument) {
              context = document2.implementation.createHTMLDocument("");
              base = context.createElement("base");
              base.href = document2.location.href;
              context.head.appendChild(base);
            } else {
              context = document2;
            }
          }
          parsed = rsingleTag.exec(data);
          scripts = !keepScripts && [];
          if (parsed) {
            return [context.createElement(parsed[1])];
          }
          parsed = buildFragment([data], context, scripts);
          if (scripts && scripts.length) {
            jQuery2(scripts).remove();
          }
          return jQuery2.merge([], parsed.childNodes);
        };
        jQuery2.fn.load = function(url, params, callback) {
          var selector, type, response, self = this, off = url.indexOf(" ");
          if (off > -1) {
            selector = stripAndCollapse(url.slice(off));
            url = url.slice(0, off);
          }
          if (isFunction(params)) {
            callback = params;
            params = void 0;
          } else if (params && typeof params === "object") {
            type = "POST";
          }
          if (self.length > 0) {
            jQuery2.ajax({
              url,
              // If "type" variable is undefined, then "GET" method will be used.
              // Make value of this field explicit since
              // user can override it through ajaxSetup method
              type: type || "GET",
              dataType: "html",
              data: params
            }).done(function(responseText) {
              response = arguments;
              self.html(selector ? (
                // If a selector was specified, locate the right elements in a dummy div
                // Exclude scripts to avoid IE 'Permission Denied' errors
                jQuery2("<div>").append(jQuery2.parseHTML(responseText)).find(selector)
              ) : (
                // Otherwise use the full result
                responseText
              ));
            }).always(callback && function(jqXHR, status) {
              self.each(function() {
                callback.apply(this, response || [jqXHR.responseText, status, jqXHR]);
              });
            });
          }
          return this;
        };
        jQuery2.expr.pseudos.animated = function(elem) {
          return jQuery2.grep(jQuery2.timers, function(fn) {
            return elem === fn.elem;
          }).length;
        };
        jQuery2.offset = {
          setOffset: function(elem, options, i) {
            var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition, position = jQuery2.css(elem, "position"), curElem = jQuery2(elem), props = {};
            if (position === "static") {
              elem.style.position = "relative";
            }
            curOffset = curElem.offset();
            curCSSTop = jQuery2.css(elem, "top");
            curCSSLeft = jQuery2.css(elem, "left");
            calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1;
            if (calculatePosition) {
              curPosition = curElem.position();
              curTop = curPosition.top;
              curLeft = curPosition.left;
            } else {
              curTop = parseFloat(curCSSTop) || 0;
              curLeft = parseFloat(curCSSLeft) || 0;
            }
            if (isFunction(options)) {
              options = options.call(elem, i, jQuery2.extend({}, curOffset));
            }
            if (options.top != null) {
              props.top = options.top - curOffset.top + curTop;
            }
            if (options.left != null) {
              props.left = options.left - curOffset.left + curLeft;
            }
            if ("using" in options) {
              options.using.call(elem, props);
            } else {
              curElem.css(props);
            }
          }
        };
        jQuery2.fn.extend({
          // offset() relates an element's border box to the document origin
          offset: function(options) {
            if (arguments.length) {
              return options === void 0 ? this : this.each(function(i) {
                jQuery2.offset.setOffset(this, options, i);
              });
            }
            var rect, win, elem = this[0];
            if (!elem) {
              return;
            }
            if (!elem.getClientRects().length) {
              return { top: 0, left: 0 };
            }
            rect = elem.getBoundingClientRect();
            win = elem.ownerDocument.defaultView;
            return {
              top: rect.top + win.pageYOffset,
              left: rect.left + win.pageXOffset
            };
          },
          // position() relates an element's margin box to its offset parent's padding box
          // This corresponds to the behavior of CSS absolute positioning
          position: function() {
            if (!this[0]) {
              return;
            }
            var offsetParent, offset, doc, elem = this[0], parentOffset = { top: 0, left: 0 };
            if (jQuery2.css(elem, "position") === "fixed") {
              offset = elem.getBoundingClientRect();
            } else {
              offset = this.offset();
              doc = elem.ownerDocument;
              offsetParent = elem.offsetParent || doc.documentElement;
              while (offsetParent && (offsetParent === doc.body || offsetParent === doc.documentElement) && jQuery2.css(offsetParent, "position") === "static") {
                offsetParent = offsetParent.parentNode;
              }
              if (offsetParent && offsetParent !== elem && offsetParent.nodeType === 1) {
                parentOffset = jQuery2(offsetParent).offset();
                parentOffset.top += jQuery2.css(offsetParent, "borderTopWidth", true);
                parentOffset.left += jQuery2.css(offsetParent, "borderLeftWidth", true);
              }
            }
            return {
              top: offset.top - parentOffset.top - jQuery2.css(elem, "marginTop", true),
              left: offset.left - parentOffset.left - jQuery2.css(elem, "marginLeft", true)
            };
          },
          // This method will return documentElement in the following cases:
          // 1) For the element inside the iframe without offsetParent, this method will return
          //    documentElement of the parent window
          // 2) For the hidden or detached element
          // 3) For body or html element, i.e. in case of the html node - it will return itself
          //
          // but those exceptions were never presented as a real life use-cases
          // and might be considered as more preferable results.
          //
          // This logic, however, is not guaranteed and can change at any point in the future
          offsetParent: function() {
            return this.map(function() {
              var offsetParent = this.offsetParent;
              while (offsetParent && jQuery2.css(offsetParent, "position") === "static") {
                offsetParent = offsetParent.offsetParent;
              }
              return offsetParent || documentElement;
            });
          }
        });
        jQuery2.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function(method, prop) {
          var top = "pageYOffset" === prop;
          jQuery2.fn[method] = function(val) {
            return access(this, function(elem, method2, val2) {
              var win;
              if (isWindow(elem)) {
                win = elem;
              } else if (elem.nodeType === 9) {
                win = elem.defaultView;
              }
              if (val2 === void 0) {
                return win ? win[prop] : elem[method2];
              }
              if (win) {
                win.scrollTo(
                  !top ? val2 : win.pageXOffset,
                  top ? val2 : win.pageYOffset
                );
              } else {
                elem[method2] = val2;
              }
            }, method, val, arguments.length);
          };
        });
        jQuery2.each(["top", "left"], function(_i, prop) {
          jQuery2.cssHooks[prop] = addGetHookIf(
            support.pixelPosition,
            function(elem, computed) {
              if (computed) {
                computed = curCSS(elem, prop);
                return rnumnonpx.test(computed) ? jQuery2(elem).position()[prop] + "px" : computed;
              }
            }
          );
        });
        jQuery2.each({ Height: "height", Width: "width" }, function(name, type) {
          jQuery2.each({
            padding: "inner" + name,
            content: type,
            "": "outer" + name
          }, function(defaultExtra, funcName) {
            jQuery2.fn[funcName] = function(margin, value) {
              var chainable = arguments.length && (defaultExtra || typeof margin !== "boolean"), extra = defaultExtra || (margin === true || value === true ? "margin" : "border");
              return access(this, function(elem, type2, value2) {
                var doc;
                if (isWindow(elem)) {
                  return funcName.indexOf("outer") === 0 ? elem["inner" + name] : elem.document.documentElement["client" + name];
                }
                if (elem.nodeType === 9) {
                  doc = elem.documentElement;
                  return Math.max(
                    elem.body["scroll" + name],
                    doc["scroll" + name],
                    elem.body["offset" + name],
                    doc["offset" + name],
                    doc["client" + name]
                  );
                }
                return value2 === void 0 ? (
                  // Get width or height on the element, requesting but not forcing parseFloat
                  jQuery2.css(elem, type2, extra)
                ) : (
                  // Set width or height on the element
                  jQuery2.style(elem, type2, value2, extra)
                );
              }, type, chainable ? margin : void 0, chainable);
            };
          });
        });
        jQuery2.each([
          "ajaxStart",
          "ajaxStop",
          "ajaxComplete",
          "ajaxError",
          "ajaxSuccess",
          "ajaxSend"
        ], function(_i, type) {
          jQuery2.fn[type] = function(fn) {
            return this.on(type, fn);
          };
        });
        jQuery2.fn.extend({
          bind: function(types, data, fn) {
            return this.on(types, null, data, fn);
          },
          unbind: function(types, fn) {
            return this.off(types, null, fn);
          },
          delegate: function(selector, types, data, fn) {
            return this.on(types, selector, data, fn);
          },
          undelegate: function(selector, types, fn) {
            return arguments.length === 1 ? this.off(selector, "**") : this.off(types, selector || "**", fn);
          },
          hover: function(fnOver, fnOut) {
            return this.on("mouseenter", fnOver).on("mouseleave", fnOut || fnOver);
          }
        });
        jQuery2.each(
          "blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),
          function(_i, name) {
            jQuery2.fn[name] = function(data, fn) {
              return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name);
            };
          }
        );
        var rtrim = /^[\s\uFEFF\xA0]+|([^\s\uFEFF\xA0])[\s\uFEFF\xA0]+$/g;
        jQuery2.proxy = function(fn, context) {
          var tmp, args, proxy;
          if (typeof context === "string") {
            tmp = fn[context];
            context = fn;
            fn = tmp;
          }
          if (!isFunction(fn)) {
            return void 0;
          }
          args = slice.call(arguments, 2);
          proxy = function() {
            return fn.apply(context || this, args.concat(slice.call(arguments)));
          };
          proxy.guid = fn.guid = fn.guid || jQuery2.guid++;
          return proxy;
        };
        jQuery2.holdReady = function(hold) {
          if (hold) {
            jQuery2.readyWait++;
          } else {
            jQuery2.ready(true);
          }
        };
        jQuery2.isArray = Array.isArray;
        jQuery2.parseJSON = JSON.parse;
        jQuery2.nodeName = nodeName;
        jQuery2.isFunction = isFunction;
        jQuery2.isWindow = isWindow;
        jQuery2.camelCase = camelCase;
        jQuery2.type = toType;
        jQuery2.now = Date.now;
        jQuery2.isNumeric = function(obj) {
          var type = jQuery2.type(obj);
          return (type === "number" || type === "string") && // parseFloat NaNs numeric-cast false positives ("")
          // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
          // subtraction forces infinities to NaN
          !isNaN(obj - parseFloat(obj));
        };
        jQuery2.trim = function(text) {
          return text == null ? "" : (text + "").replace(rtrim, "$1");
        };
        if (typeof define === "function" && define.amd) {
          define("jquery", [], function() {
            return jQuery2;
          });
        }
        var _jQuery = window2.jQuery, _$ = window2.$;
        jQuery2.noConflict = function(deep) {
          if (window2.$ === jQuery2) {
            window2.$ = _$;
          }
          if (deep && window2.jQuery === jQuery2) {
            window2.jQuery = _jQuery;
          }
          return jQuery2;
        };
        if (typeof noGlobal === "undefined") {
          window2.jQuery = window2.$ = jQuery2;
        }
        return jQuery2;
      });
    }
  });

  // config/esbuild-jquery-shim.js
  var import_jquery;
  var init_esbuild_jquery_shim = __esm({
    "config/esbuild-jquery-shim.js"() {
      import_jquery = __toESM(require_jquery());
      window.$ = import_jquery.default;
      window.jQuery = import_jquery.default;
    }
  });

  // app/javascript/generated/translations.json
  var require_translations = __commonJS({
    "app/javascript/generated/translations.json"(exports, module) {
      module.exports = {
        en: {
          campaign_wizard: {
            ai_welcome: {
              greeting: "Hi, I'm Uppie!",
              subtitle: "Your Campaign Building Buddy",
              intro: "I'll help you build the perfect campaign - pick from proven templates or create your own.",
              feature_proven: "Proven templates from your library",
              feature_ai: "AI-powered template matching",
              feature_setup: "Option to build custom campaigns",
              choose_platform: "Choose Your Platform",
              choose_platform_subtitle: "Select the advertising platform for your campaign",
              facebook_label: "Facebook & Instagram",
              facebook_description: "Launch campaigns on Facebook and Instagram to reach customized audiences",
              google_label: "Google Ads",
              google_description: "Reach customers searching for businesses like yours on Google Search",
              describe_heading: "What kind of campaign do you want to launch?",
              describe_subtitle: "Describe your campaign and I'll help you get started.",
              describe_placeholder: "e.g., A lead generation campaign for a dental clinic offering free whitening...",
              lets_go: "Let's Go!",
              find_templates: "Find Templates",
              searching: "Searching...",
              back: "Back",
              browse_directly: "Rather just select directly?",
              results_greeting: "Great news!",
              results_subtitle: "Here's what I found",
              results_intro: "Pick a proven template to launch quickly, or build your own campaign from scratch.",
              results_heading: "Templates from your library",
              results_message: "These templates are great matches for your campaign. Library templates are proven performers and can be launched in minutes. Or, build a fully custom campaign.",
              results_feature_proven: "Library templates are proven performers",
              results_feature_custom: "Or build a fully custom campaign",
              results_feature_easy: "Quick setup - launch in minutes"
            },
            ai_search: {
              results_heading: "I found %{count} templates for you!",
              results_subheading: "Based on your search:",
              custom_campaign_title: "Build a Custom Campaign with Uppie",
              custom_campaign_description: "Let AI create a fully customized campaign from scratch",
              custom_campaign_description_inline: "Start from scratch with full control over your campaign",
              coming_soon: "Coming soon",
              no_results_heading: "No matching templates found",
              no_results_description: "Try a different description or browse the full template library.",
              browse_all: "Browse all templates instead",
              start_over: "Start over",
              search_error: "Something went wrong searching for templates. Please try again."
            },
            shared: {
              step: "Step",
              previous: "Previous",
              continue: "Continue",
              review_launch: "Review & Launch",
              daily_budget: "Daily Budget",
              target_location: "Target Location",
              select_platform: "Select Platform",
              select_template: "Select Template",
              launch_campaign: "Launch Campaign",
              not_included: "Not included",
              not_selected: "Not selected",
              not_set: "Not set",
              edit: "Edit",
              fix_this: "Fix this \u2192",
              ready_to_launch: "Ready to launch!",
              ready_description: "Your campaign is configured and ready to go live.",
              ready_description_google: "Your Google campaign is configured and ready to go live.",
              action_required: "Action Required",
              cannot_launch: "Cannot Launch",
              check_again: "Check again",
              fix_automatically: "Fix automatically \u2192",
              remove: "Remove",
              go_back: "Go Back",
              saving: "Saving...",
              launching: "Launching...",
              advanced_settings: "Advanced Settings",
              optional: "(optional)",
              per_day: "/day",
              per_month: "/mo",
              monthly_estimate: "Monthly estimate",
              monthly_basis: "Based on 30.4 days avg",
              checking_errors: "Checking for potential errors before launching...",
              customize_description: "Customize campaign name, pixel, audience, and more",
              location_tip: "You can target by address with a radius, ZIP code, city, state, or country. Add multiple locations to expand your reach.",
              mobile_first_tip: "Make sure your page is mobile-friendly since most users browse on phones.",
              mobile_first: "Mobile first:",
              no_additional_info: "No Additional Info Needed",
              messenger_direct_info: "Messenger campaigns connect directly through Facebook Messenger.",
              direct_messenger_connection: "Direct Messenger connection",
              phone_number: "Phone Number",
              country_code: "Country Code",
              enter_phone: "Enter phone number",
              enter_business_phone: "Enter your business phone number",
              phone_tip: "This is the number people will call when they click your ad. Make sure someone is available to answer!",
              tip: "Tip:",
              pro_tip: "Pro tip:",
              website_url: "Website URL",
              select_country: "Select Country",
              placeholders: "Placeholders",
              contact: "Contact",
              messenger_direct: "Messenger Direct",
              end_date_required: "This campaign requires an end date",
              target_location_description: "Choose where your ads will be shown to reach the right audience.",
              validation: {
                select_campaign_type: "Please select a campaign type",
                add_location: "Please add at least one target location",
                enter_budget: "Please enter a daily budget of at least %{min}",
                enter_url: "Please enter a landing page URL",
                valid_url: "Please enter a valid URL (e.g., https://example.com)",
                fill_field: "Please fill in the %{field} field",
                enter_end_date: "Please select an end date for this campaign",
                unable_to_validate: "Unable to validate campaign",
                overlapping_locations: "Your include locations overlap. Facebook does not allow overlapping include locations \u2014 please remove one to continue.",
                image_too_small: "Image too small for Dynamic Creative (%{dimensions}, minimum 600\xD7600px)",
                images_too_small_title: "Some images are too small for Dynamic Creative",
                images_too_small_description: "Facebook requires images to be at least 600\xD7600 pixels for Dynamic Creative campaigns."
              }
            },
            facebook: {
              step_labels: {
                goal: "Goal",
                budget: "Budget",
                location: "Location",
                details: "Details",
                contact: "Contact",
                review: "Review"
              },
              step_descriptions: {
                campaign_type: "Campaign Type",
                daily_budget: "Daily Budget",
                target_location: "Target Location",
                custom_values: "Custom Values",
                contact_details: "Contact Details",
                review_launch: "Review & Launch"
              },
              campaign_types: {
                lead_form: {
                  label: "Lead Form",
                  short_description: "Collect contact info directly on Facebook",
                  description: "If you want to collect email addresses or phone numbers, this is the best choice. Instead of sending people to a website, a simple form appears on their screen immediately. It removes extra steps so more people are likely to fill it out. No pixel needed."
                },
                call_now: {
                  label: "Call Now",
                  short_description: "Drive phone calls to your business",
                  description: "If you want to talk to potential customers immediately, choose this option. When someone taps the button on your ad, their phone automatically calls your business. It works great for booking appointments or answering quick questions."
                },
                landing_page: {
                  label: "Landing Page",
                  short_description: "Send people to your website",
                  description: "Send people to your website landing page. Ideal for custom funnels or detailed offers."
                },
                messenger: {
                  label: "Messenger (Leads)",
                  short_description: "Generate leads through Messenger",
                  description: "Start Messenger conversations to generate leads. Great for businesses that sell through chat."
                },
                messenger_engagement: {
                  label: "Messenger (Engagement)",
                  short_description: "Build engagement through Messenger",
                  description: "Encourage Messenger engagement with your business. Best for nurturing and Q&A."
                }
              },
              pick_ad_type: "Pick Your Ad Type",
              pick_ad_type_description: "There are a few different ways to run ads on Facebook. Choose the goal that best matches what you want to achieve.",
              read_more: "Read more",
              read_less: "Read less",
              set_daily_budget: "Set your daily budget",
              budget_question: "How much do you want to spend per day on your ad?",
              budget_tip: "We recommend at least %{currency}30/day to give Facebook enough data to optimize your campaign effectively.",
              contact: {
                landing_page: {
                  title: "Landing Page",
                  description: "Where should visitors land after clicking your ad?",
                  field_label: "Landing Page URL"
                },
                thank_you: {
                  title: "Thank You Page",
                  description: "Where should leads go after submitting the form? (optional)",
                  field_label: "Thank You Page URL"
                },
                phone: {
                  title: "Phone Number",
                  description: "What number should people call from your ad?",
                  field_label: "Website URL"
                },
                default: {
                  title: "Contact Details",
                  description: "Where should people go after engaging with your ad?",
                  field_label: "Website URL"
                }
              },
              review: {
                campaign_goal: "Campaign Goal",
                review_settings: "Review your campaign settings before launching",
                placeholders: "Placeholders",
                customize_description: "Customize campaign name, pixel, audience, and more"
              },
              audience_insights: {
                estimated_audience_size: "Estimated Audience Size",
                people_in_target_area: "people in your target area",
                targeting_updated: "Targeting Updated",
                deprecated_message: "Some targeting interests have been deprecated and automatically removed.",
                edit_template_targeting: "Edit template targeting \u2192",
                campaign_timeline: "Campaign Timeline Estimates",
                time_to_reach: "Time to reach audience size",
                time_to_learn: "Time for Facebook to Learn Audience",
                no_changes_during: "Do not make any changes during this period",
                time_to_optimize: "Time for Facebook to Optimize Costs",
                minor_changes_only: "Only minor changes recommended - major edits reset learning",
                based_on_cpm: "Based on $40 CPM, 1% CTR, 10% conversion rate"
              }
            },
            google: {
              step_labels: {
                campaign_type: "Campaign Type",
                budget: "Budget",
                location: "Location",
                details: "Details",
                logo: "Logo",
                youtube: "YouTube",
                phone: "Phone",
                review: "Review"
              },
              step_descriptions: {
                search_vs_pmax: "Search vs PMAX",
                daily_budget: "Daily Budget",
                target_location: "Target Location",
                website_custom_values: "Website & Custom Values",
                logo_selection: "Logo Selection (PMAX)",
                youtube_videos: "YouTube Videos (PMAX)",
                phone_number_optional: "Phone Number (Optional)",
                review_launch: "Review & Launch"
              },
              campaign_types: {
                search: {
                  label: "Search Campaign",
                  description: "Show text ads to people actively searching for your products or services on Google. Great for capturing high-intent customers who are ready to take action. Your ads appear at the top of search results."
                },
                pmax: {
                  label: "Performance Max",
                  description: "Reach customers across all Google channels including Search, Display, YouTube, and more with a single campaign. Uses AI to automatically optimize your ads. Requires both landscape (1.91:1) and square (1:1) images."
                }
              },
              launch_title: "Launch Your Campaign",
              choose_campaign_type: "Choose Your Campaign Type",
              choose_campaign_type_description: "Select how you want to reach customers on Google",
              ai_powered: "AI-Powered",
              pmax_unavailable: "Performance Max unavailable:",
              pmax_unavailable_description: "This template only supports Search campaigns. PMAX requires both landscape (1.91:1) and square (1:1) images.",
              set_daily_budget: "Set your daily budget",
              budget_question: "How much do you want to spend per day on your Google ad?",
              budget_tip: "We recommend at least %{currency}50/day to give Google enough data to optimize your campaign.",
              target_audience: "Target Your Audience",
              target_audience_description: "Choose where you want your ads to appear",
              campaign_details: "Campaign Details",
              campaign_details_description: "Add your website and customize your campaign",
              website_url_heading: "Website URL",
              website_url_description: "Where should your ads direct people?",
              use_ez_page_description: "Use a pre-built landing page instead",
              business_name_google_limit: "Google limits business names to 25 characters",
              current_client_name: "Current client name:",
              characters: "characters",
              customize_ad_content: "Customize the ad content for this campaign",
              details_tip: "Make sure your website URL is working and mobile-friendly for the best results.",
              logo_title: "Logo",
              logo_description: "Select a square logo image for your Performance Max campaign",
              logo_required_label: "Required:",
              logo_tip: "Google requires a square logo for Performance Max campaigns. Select at least one square image below.",
              youtube_title: "YouTube Videos",
              youtube_description: "Add YouTube video links to enhance your Performance Max campaign",
              youtube_links_heading: "YouTube Video Links",
              youtube_enter_description: "Paste YouTube video URLs to include in your campaign",
              youtube_add_link: "Add another link",
              youtube_benefit_why: "Why add YouTube videos?",
              youtube_benefit_tip: "Video assets help your PMax campaign reach more people across YouTube and other Google properties.",
              skip_youtube_description: "I don't want to add YouTube videos to this campaign",
              phone_title: "Phone Number",
              phone_description: "Add a phone number so customers can call you directly from the ad",
              skip_step: "Skip this step",
              skip_phone_description: "I don't want to add a phone number to this campaign",
              phone_enter_description: "Enter a phone number where customers can reach you",
              phone_benefit_tip: "Ads with phone numbers can increase calls by up to 8% and help customers connect with you faster.",
              phone_benefit_why: "Why add a phone number?",
              review: {
                review_settings: "Review your campaign settings before launching",
                campaign_type: "Campaign Type",
                website: "Website",
                logo: "Logo",
                logos_selected: "%{count} logos selected",
                youtube_videos: "YouTube Videos",
                youtube_links_count: "%{count} video links",
                phone_number: "Phone Number",
                custom_values: "Custom Values",
                select_media: "Select Media",
                select_images: "Select Images",
                images_selected: "%{count} images selected",
                pmax_media_requirement: "PMAX requires at least 1 landscape (1.91:1) and 1 square (1:1) image",
                required_media: "Select at least 1 landscape and 1 square image to launch your Performance Max campaign.",
                required_label: "Required:"
              },
              validation: {
                select_valid_type: "Please select a valid campaign type",
                enter_website: "Please enter a website URL",
                enter_business_name: "Please enter a business name",
                business_name_length: "Business name must be 25 characters or less",
                select_logo: "Please select at least one logo image",
                pmax_media: "PMAX requires at least 1 landscape (1.91:1) and 1 square (1:1) image",
                phone_too_short: "Phone number looks too short"
              }
            }
          }
        },
        es: {
          campaign_wizard: {
            shared: {
              step: "Paso",
              previous: "Anterior",
              continue: "Continuar",
              review_launch: "Revisar y Lanzar",
              daily_budget: "Presupuesto Diario",
              target_location: "Ubicaci\xF3n Objetivo",
              select_platform: "Seleccionar Plataforma",
              select_template: "Seleccionar Plantilla",
              launch_campaign: "Lanzar Campa\xF1a",
              not_included: "No incluido",
              not_set: "No configurado",
              edit: "Editar",
              fix_this: "Corregir esto \u2192",
              ready_to_launch: "\xA1Listo para lanzar!",
              ready_description: "Tu campa\xF1a est\xE1 configurada y lista para publicarse.",
              ready_description_google: "Tu campa\xF1a de Google est\xE1 configurada y lista para publicarse.",
              action_required: "Acci\xF3n Requerida",
              cannot_launch: "No se puede lanzar",
              check_again: "Verificar de nuevo",
              fix_automatically: "Corregir autom\xE1ticamente \u2192",
              remove: "Eliminar",
              go_back: "Volver",
              advanced_settings: "Configuraci\xF3n Avanzada",
              optional: "(opcional)",
              per_day: "/d\xEDa",
              per_month: "/mes",
              monthly_estimate: "Estimaci\xF3n mensual",
              monthly_basis: "Basado en un promedio de 30.4 d\xEDas",
              checking_errors: "Verificando posibles errores antes de lanzar...",
              customize_description: "Personaliza el nombre de la campa\xF1a, p\xEDxel, audiencia y m\xE1s",
              location_tip: "Puedes segmentar por direcci\xF3n con radio, c\xF3digo postal, ciudad, estado o pa\xEDs. Agrega m\xFAltiples ubicaciones para ampliar tu alcance.",
              mobile_first_tip: "Aseg\xFArate de que tu p\xE1gina sea compatible con dispositivos m\xF3viles, ya que la mayor\xEDa de los usuarios navegan desde tel\xE9fonos.",
              mobile_first: "Primero m\xF3vil:",
              no_additional_info: "No se necesita informaci\xF3n adicional",
              messenger_direct_info: "Las campa\xF1as de Messenger se conectan directamente a trav\xE9s de Facebook Messenger.",
              direct_messenger_connection: "Conexi\xF3n directa por Messenger",
              phone_number: "N\xFAmero de Tel\xE9fono",
              country_code: "C\xF3digo de Pa\xEDs",
              enter_phone: "Ingresa el n\xFAmero de tel\xE9fono",
              enter_business_phone: "Ingresa el n\xFAmero de tel\xE9fono de tu negocio",
              phone_tip: "Este es el n\xFAmero al que las personas llamar\xE1n cuando hagan clic en tu anuncio. \xA1Aseg\xFArate de que alguien est\xE9 disponible para responder!",
              tip: "Consejo:",
              pro_tip: "Consejo profesional:",
              website_url: "URL del sitio web",
              select_country: "Seleccionar Pa\xEDs",
              placeholders: "Marcadores de posici\xF3n",
              contact: "Contacto",
              messenger_direct: "Messenger Directo",
              end_date_required: "Esta campa\xF1a requiere una fecha de finalizaci\xF3n",
              target_location_description: "Elige d\xF3nde se mostrar\xE1n tus anuncios para llegar a la audiencia correcta.",
              validation: {
                select_campaign_type: "Por favor selecciona un tipo de campa\xF1a",
                add_location: "Por favor agrega al menos una ubicaci\xF3n objetivo",
                enter_budget: "Por favor ingresa un presupuesto diario de al menos %{min}",
                enter_url: "Por favor ingresa una URL de p\xE1gina de destino",
                valid_url: "Por favor ingresa una URL v\xE1lida (ej., https://ejemplo.com)",
                fill_field: "Por favor completa el campo %{field}",
                enter_end_date: "Por favor selecciona una fecha de finalizaci\xF3n para esta campa\xF1a",
                unable_to_validate: "No se pudo validar la campa\xF1a",
                image_too_small: "Imagen demasiado peque\xF1a para Dynamic Creative (%{dimensions}, m\xEDnimo 600\xD7600px)",
                images_too_small_title: "Algunas im\xE1genes son demasiado peque\xF1as para Dynamic Creative",
                images_too_small_description: "Facebook requiere que las im\xE1genes tengan al menos 600\xD7600 p\xEDxeles para campa\xF1as de Dynamic Creative."
              }
            },
            facebook: {
              step_labels: {
                goal: "Objetivo",
                budget: "Presupuesto",
                location: "Ubicaci\xF3n",
                details: "Detalles",
                contact: "Contacto",
                review: "Revisi\xF3n"
              },
              step_descriptions: {
                campaign_type: "Tipo de Campa\xF1a",
                daily_budget: "Presupuesto Diario",
                target_location: "Ubicaci\xF3n Objetivo",
                custom_values: "Valores Personalizados",
                contact_details: "Detalles de Contacto",
                review_launch: "Revisar y Lanzar"
              },
              campaign_types: {
                lead_form: {
                  label: "Formulario de Clientes Potenciales",
                  short_description: "Recopila informaci\xF3n de contacto directamente en Facebook",
                  description: "Si deseas recopilar direcciones de correo electr\xF3nico o n\xFAmeros de tel\xE9fono, esta es la mejor opci\xF3n. En lugar de enviar personas a un sitio web, un formulario simple aparece en su pantalla inmediatamente. Elimina pasos adicionales para que m\xE1s personas lo completen. No se necesita p\xEDxel."
                },
                call_now: {
                  label: "Llamar Ahora",
                  short_description: "Genera llamadas telef\xF3nicas a tu negocio",
                  description: "Si deseas hablar con clientes potenciales de inmediato, elige esta opci\xF3n. Cuando alguien toca el bot\xF3n en tu anuncio, su tel\xE9fono llama autom\xE1ticamente a tu negocio. Funciona muy bien para agendar citas o responder preguntas r\xE1pidas."
                },
                landing_page: {
                  label: "P\xE1gina de Destino",
                  short_description: "Env\xEDa personas a tu sitio web",
                  description: "Env\xEDa personas a tu p\xE1gina de destino. Ideal para embudos personalizados u ofertas detalladas."
                },
                messenger: {
                  label: "Messenger (Clientes Potenciales)",
                  short_description: "Genera clientes potenciales a trav\xE9s de Messenger",
                  description: "Inicia conversaciones en Messenger para generar clientes potenciales. Ideal para negocios que venden por chat."
                },
                messenger_engagement: {
                  label: "Messenger (Interacci\xF3n)",
                  short_description: "Fomenta la interacci\xF3n a trav\xE9s de Messenger",
                  description: "Fomenta la interacci\xF3n en Messenger con tu negocio. Ideal para nutrir y preguntas y respuestas."
                }
              },
              pick_ad_type: "Elige tu tipo de anuncio",
              pick_ad_type_description: "Hay varias formas de publicar anuncios en Facebook. Elige el objetivo que mejor se ajuste a lo que deseas lograr.",
              read_more: "Leer m\xE1s",
              read_less: "Leer menos",
              set_daily_budget: "Establece tu presupuesto diario",
              budget_question: "\xBFCu\xE1nto deseas gastar por d\xEDa en tu anuncio?",
              budget_tip: "Recomendamos al menos %{currency}30/d\xEDa para darle a Facebook suficientes datos para optimizar tu campa\xF1a efectivamente.",
              contact: {
                landing_page: {
                  title: "P\xE1gina de Destino",
                  description: "\xBFA d\xF3nde deben llegar los visitantes despu\xE9s de hacer clic en tu anuncio?",
                  field_label: "URL de P\xE1gina de Destino"
                },
                thank_you: {
                  title: "P\xE1gina de Agradecimiento",
                  description: "\xBFA d\xF3nde deben ir los clientes potenciales despu\xE9s de enviar el formulario? (opcional)",
                  field_label: "URL de P\xE1gina de Agradecimiento"
                },
                phone: {
                  title: "N\xFAmero de Tel\xE9fono",
                  description: "\xBFQu\xE9 n\xFAmero deben llamar las personas desde tu anuncio?",
                  field_label: "URL del sitio web"
                },
                default: {
                  title: "Detalles de Contacto",
                  description: "\xBFA d\xF3nde deben ir las personas despu\xE9s de interactuar con tu anuncio?",
                  field_label: "URL del sitio web"
                }
              },
              review: {
                campaign_goal: "Objetivo de la Campa\xF1a",
                review_settings: "Revisa la configuraci\xF3n de tu campa\xF1a antes de lanzar",
                placeholders: "Marcadores de posici\xF3n",
                customize_description: "Personaliza el nombre de la campa\xF1a, p\xEDxel, audiencia y m\xE1s"
              },
              audience_insights: {
                estimated_audience_size: "Tama\xF1o Estimado de Audiencia",
                people_in_target_area: "personas en tu \xE1rea objetivo",
                targeting_updated: "Segmentaci\xF3n Actualizada",
                deprecated_message: "Algunos intereses de segmentaci\xF3n han sido descontinuados y eliminados autom\xE1ticamente.",
                edit_template_targeting: "Editar segmentaci\xF3n de plantilla \u2192",
                campaign_timeline: "Estimaciones de Cronograma de Campa\xF1a",
                time_to_reach: "Tiempo para alcanzar el tama\xF1o de audiencia",
                time_to_learn: "Tiempo para que Facebook Aprenda la Audiencia",
                no_changes_during: "No realices cambios durante este per\xEDodo",
                time_to_optimize: "Tiempo para que Facebook Optimice Costos",
                minor_changes_only: "Solo se recomiendan cambios menores - las ediciones mayores reinician el aprendizaje",
                based_on_cpm: "Basado en $40 CPM, 1% CTR, 10% tasa de conversi\xF3n"
              }
            },
            google: {
              step_labels: {
                campaign_type: "Tipo de Campa\xF1a",
                budget: "Presupuesto",
                location: "Ubicaci\xF3n",
                details: "Detalles",
                phone: "Tel\xE9fono",
                review: "Revisi\xF3n"
              },
              step_descriptions: {
                search_vs_pmax: "B\xFAsqueda vs PMAX",
                daily_budget: "Presupuesto Diario",
                target_location: "Ubicaci\xF3n Objetivo",
                website_custom_values: "Sitio Web y Valores Personalizados",
                phone_number_optional: "N\xFAmero de Tel\xE9fono (Opcional)",
                review_launch: "Revisar y Lanzar"
              },
              campaign_types: {
                search: {
                  label: "Campa\xF1a de B\xFAsqueda",
                  description: "Muestra anuncios de texto a personas que buscan activamente tus productos o servicios en Google. Ideal para captar clientes con alta intenci\xF3n que est\xE1n listos para actuar. Tus anuncios aparecen en la parte superior de los resultados de b\xFAsqueda."
                },
                pmax: {
                  label: "Performance Max",
                  description: "Llega a clientes en todos los canales de Google, incluyendo B\xFAsqueda, Display, YouTube y m\xE1s, con una sola campa\xF1a. Usa IA para optimizar autom\xE1ticamente tus anuncios. Requiere im\xE1genes horizontales (1.91:1) y cuadradas (1:1)."
                }
              },
              choose_campaign_type: "Elige tu tipo de campa\xF1a",
              choose_campaign_type_description: "Selecciona c\xF3mo quieres llegar a los clientes en Google",
              ai_powered: "Impulsado por IA",
              pmax_unavailable: "Performance Max no disponible:",
              pmax_unavailable_description: "Esta plantilla solo admite campa\xF1as de B\xFAsqueda. PMAX requiere im\xE1genes horizontales (1.91:1) y cuadradas (1:1).",
              set_daily_budget: "Establece tu presupuesto diario",
              budget_question: "\xBFCu\xE1nto deseas gastar por d\xEDa en tu anuncio de Google?",
              budget_tip: "Recomendamos al menos %{currency}50/d\xEDa para darle a Google suficientes datos para optimizar tu campa\xF1a.",
              target_audience: "Segmenta tu Audiencia",
              target_audience_description: "Elige d\xF3nde deseas que aparezcan tus anuncios",
              campaign_details: "Detalles de la Campa\xF1a",
              campaign_details_description: "Agrega tu sitio web y personaliza tu campa\xF1a",
              website_url_heading: "URL del Sitio Web",
              website_url_description: "\xBFA d\xF3nde deben dirigirse tus anuncios?",
              use_ez_page_description: "Usa una p\xE1gina de destino predise\xF1ada",
              business_name_google_limit: "Google limita los nombres de negocios a 25 caracteres",
              current_client_name: "Nombre del cliente actual:",
              characters: "caracteres",
              customize_ad_content: "Personaliza el contenido del anuncio para esta campa\xF1a",
              details_tip: "Aseg\xFArate de que la URL de tu sitio web funcione y sea compatible con dispositivos m\xF3viles para obtener los mejores resultados.",
              phone_title: "N\xFAmero de Tel\xE9fono",
              phone_description: "Agrega un n\xFAmero de tel\xE9fono para que los clientes puedan llamarte directamente desde el anuncio",
              skip_step: "Omitir este paso",
              skip_phone_description: "No quiero agregar un n\xFAmero de tel\xE9fono a esta campa\xF1a",
              phone_enter_description: "Ingresa un n\xFAmero de tel\xE9fono donde los clientes puedan contactarte",
              phone_benefit_tip: "Los anuncios con n\xFAmeros de tel\xE9fono pueden aumentar las llamadas hasta en un 8% y ayudar a los clientes a conectarse contigo m\xE1s r\xE1pido.",
              phone_benefit_why: "\xBFPor qu\xE9 agregar un n\xFAmero de tel\xE9fono?",
              review: {
                review_settings: "Revisa la configuraci\xF3n de tu campa\xF1a antes de lanzar",
                campaign_type: "Tipo de Campa\xF1a",
                website: "Sitio Web",
                phone_number: "N\xFAmero de Tel\xE9fono",
                custom_values: "Valores Personalizados",
                select_media: "Seleccionar Medios",
                select_images: "Seleccionar Im\xE1genes",
                images_selected: "%{count} im\xE1genes seleccionadas",
                pmax_media_requirement: "PMAX requiere al menos 1 imagen horizontal (1.91:1) y 1 cuadrada (1:1)",
                required_media: "Selecciona al menos 1 imagen horizontal y 1 cuadrada para lanzar tu campa\xF1a Performance Max.",
                required_label: "Requerido:"
              },
              validation: {
                select_valid_type: "Por favor selecciona un tipo de campa\xF1a v\xE1lido",
                enter_website: "Por favor ingresa una URL del sitio web",
                enter_business_name: "Por favor ingresa un nombre de negocio",
                business_name_length: "El nombre del negocio debe tener 25 caracteres o menos",
                pmax_media: "PMAX requiere al menos 1 imagen horizontal (1.91:1) y 1 cuadrada (1:1)",
                phone_too_short: "El n\xFAmero de tel\xE9fono parece demasiado corto"
              }
            }
          }
        },
        fr: {
          campaign_wizard: {
            shared: {
              step: "\xC9tape",
              previous: "Pr\xE9c\xE9dent",
              continue: "Continuer",
              review_launch: "V\xE9rifier et Lancer",
              daily_budget: "Budget Quotidien",
              target_location: "Zone Cible",
              select_platform: "S\xE9lectionner la Plateforme",
              select_template: "S\xE9lectionner le Mod\xE8le",
              launch_campaign: "Lancer la Campagne",
              not_included: "Non inclus",
              not_set: "Non d\xE9fini",
              edit: "Modifier",
              fix_this: "Corriger ceci \u2192",
              ready_to_launch: "Pr\xEAt \xE0 lancer !",
              ready_description: "Votre campagne est configur\xE9e et pr\xEAte \xE0 \xEAtre diffus\xE9e.",
              ready_description_google: "Votre campagne Google est configur\xE9e et pr\xEAte \xE0 \xEAtre diffus\xE9e.",
              action_required: "Action Requise",
              cannot_launch: "Impossible de lancer",
              check_again: "V\xE9rifier \xE0 nouveau",
              fix_automatically: "Corriger automatiquement \u2192",
              remove: "Supprimer",
              go_back: "Retour",
              advanced_settings: "Param\xE8tres Avanc\xE9s",
              optional: "(facultatif)",
              per_day: "/jour",
              per_month: "/mois",
              monthly_estimate: "Estimation mensuelle",
              monthly_basis: "Bas\xE9 sur une moyenne de 30,4 jours",
              checking_errors: "V\xE9rification des erreurs potentielles avant le lancement...",
              customize_description: "Personnalisez le nom de la campagne, le pixel, l'audience et plus",
              location_tip: "Vous pouvez cibler par adresse avec un rayon, code postal, ville, \xE9tat ou pays. Ajoutez plusieurs emplacements pour \xE9largir votre port\xE9e.",
              mobile_first_tip: "Assurez-vous que votre page est adapt\xE9e aux mobiles car la plupart des utilisateurs naviguent sur t\xE9l\xE9phone.",
              mobile_first: "Mobile d'abord :",
              no_additional_info: "Aucune information suppl\xE9mentaire n\xE9cessaire",
              messenger_direct_info: "Les campagnes Messenger se connectent directement via Facebook Messenger.",
              direct_messenger_connection: "Connexion Messenger directe",
              phone_number: "Num\xE9ro de T\xE9l\xE9phone",
              country_code: "Code Pays",
              enter_phone: "Entrez le num\xE9ro de t\xE9l\xE9phone",
              enter_business_phone: "Entrez le num\xE9ro de t\xE9l\xE9phone de votre entreprise",
              phone_tip: "C'est le num\xE9ro que les gens appelleront en cliquant sur votre annonce. Assurez-vous que quelqu'un est disponible pour r\xE9pondre !",
              tip: "Conseil :",
              pro_tip: "Conseil pro :",
              website_url: "URL du site web",
              select_country: "S\xE9lectionner le Pays",
              placeholders: "Espaces r\xE9serv\xE9s",
              contact: "Contact",
              messenger_direct: "Messenger Direct",
              end_date_required: "Cette campagne n\xE9cessite une date de fin",
              target_location_description: "Choisissez o\xF9 vos publicit\xE9s seront diffus\xE9es pour atteindre le bon public.",
              validation: {
                select_campaign_type: "Veuillez s\xE9lectionner un type de campagne",
                add_location: "Veuillez ajouter au moins une zone cible",
                enter_budget: "Veuillez entrer un budget quotidien d'au moins %{min}",
                enter_url: "Veuillez entrer une URL de page de destination",
                valid_url: "Veuillez entrer une URL valide (ex., https://exemple.com)",
                fill_field: "Veuillez remplir le champ %{field}",
                enter_end_date: "Veuillez s\xE9lectionner une date de fin pour cette campagne",
                unable_to_validate: "Impossible de valider la campagne",
                image_too_small: "Image trop petite pour Dynamic Creative (%{dimensions}, minimum 600\xD7600px)",
                images_too_small_title: "Certaines images sont trop petites pour Dynamic Creative",
                images_too_small_description: "Facebook exige que les images mesurent au moins 600\xD7600 pixels pour les campagnes Dynamic Creative."
              }
            },
            facebook: {
              step_labels: {
                goal: "Objectif",
                budget: "Budget",
                location: "Emplacement",
                details: "D\xE9tails",
                contact: "Contact",
                review: "V\xE9rification"
              },
              step_descriptions: {
                campaign_type: "Type de Campagne",
                daily_budget: "Budget Quotidien",
                target_location: "Zone Cible",
                custom_values: "Valeurs Personnalis\xE9es",
                contact_details: "Coordonn\xE9es",
                review_launch: "V\xE9rifier et Lancer"
              },
              campaign_types: {
                lead_form: {
                  label: "Formulaire de Prospects",
                  short_description: "Collectez les coordonn\xE9es directement sur Facebook",
                  description: "Si vous souhaitez collecter des adresses e-mail ou des num\xE9ros de t\xE9l\xE9phone, c'est le meilleur choix. Au lieu d'envoyer les gens vers un site web, un formulaire simple appara\xEEt imm\xE9diatement sur leur \xE9cran. Cela supprime les \xE9tapes suppl\xE9mentaires pour que plus de personnes le remplissent. Aucun pixel n\xE9cessaire."
                },
                call_now: {
                  label: "Appeler Maintenant",
                  short_description: "G\xE9n\xE9rez des appels t\xE9l\xE9phoniques vers votre entreprise",
                  description: "Si vous souhaitez parler imm\xE9diatement \xE0 des clients potentiels, choisissez cette option. Lorsque quelqu'un appuie sur le bouton de votre annonce, son t\xE9l\xE9phone appelle automatiquement votre entreprise. Id\xE9al pour prendre des rendez-vous ou r\xE9pondre \xE0 des questions rapides."
                },
                landing_page: {
                  label: "Page de Destination",
                  short_description: "Envoyez les gens vers votre site web",
                  description: "Envoyez les gens vers votre page de destination. Id\xE9al pour les entonnoirs personnalis\xE9s ou les offres d\xE9taill\xE9es."
                },
                messenger: {
                  label: "Messenger (Prospects)",
                  short_description: "G\xE9n\xE9rez des prospects via Messenger",
                  description: "D\xE9marrez des conversations Messenger pour g\xE9n\xE9rer des prospects. Id\xE9al pour les entreprises qui vendent par chat."
                },
                messenger_engagement: {
                  label: "Messenger (Engagement)",
                  short_description: "D\xE9veloppez l'engagement via Messenger",
                  description: "Encouragez l'engagement Messenger avec votre entreprise. Id\xE9al pour le nurturing et les questions-r\xE9ponses."
                }
              },
              pick_ad_type: "Choisissez votre type d'annonce",
              pick_ad_type_description: "Il existe plusieurs fa\xE7ons de diffuser des annonces sur Facebook. Choisissez l'objectif qui correspond le mieux \xE0 ce que vous souhaitez accomplir.",
              read_more: "Lire plus",
              read_less: "Lire moins",
              set_daily_budget: "D\xE9finissez votre budget quotidien",
              budget_question: "Combien souhaitez-vous d\xE9penser par jour pour votre annonce ?",
              budget_tip: "Nous recommandons au moins %{currency}30/jour pour donner \xE0 Facebook suffisamment de donn\xE9es pour optimiser efficacement votre campagne.",
              contact: {
                landing_page: {
                  title: "Page de Destination",
                  description: "O\xF9 les visiteurs doivent-ils atterrir apr\xE8s avoir cliqu\xE9 sur votre annonce ?",
                  field_label: "URL de la Page de Destination"
                },
                thank_you: {
                  title: "Page de Remerciement",
                  description: "O\xF9 les prospects doivent-ils aller apr\xE8s avoir soumis le formulaire ? (facultatif)",
                  field_label: "URL de la Page de Remerciement"
                },
                phone: {
                  title: "Num\xE9ro de T\xE9l\xE9phone",
                  description: "Quel num\xE9ro les gens doivent-ils appeler depuis votre annonce ?",
                  field_label: "URL du site web"
                },
                default: {
                  title: "Coordonn\xE9es",
                  description: "O\xF9 les gens doivent-ils aller apr\xE8s avoir interagi avec votre annonce ?",
                  field_label: "URL du site web"
                }
              },
              review: {
                campaign_goal: "Objectif de la Campagne",
                review_settings: "V\xE9rifiez les param\xE8tres de votre campagne avant le lancement",
                placeholders: "Espaces r\xE9serv\xE9s",
                customize_description: "Personnalisez le nom de la campagne, le pixel, l'audience et plus"
              },
              audience_insights: {
                estimated_audience_size: "Taille Estim\xE9e de l'Audience",
                people_in_target_area: "personnes dans votre zone cible",
                targeting_updated: "Ciblage Mis \xE0 Jour",
                deprecated_message: "Certains centres d'int\xE9r\xEAt de ciblage ont \xE9t\xE9 abandonn\xE9s et automatiquement supprim\xE9s.",
                edit_template_targeting: "Modifier le ciblage du mod\xE8le \u2192",
                campaign_timeline: "Estimations du Calendrier de Campagne",
                time_to_reach: "Temps pour atteindre la taille de l'audience",
                time_to_learn: "Temps pour que Facebook Apprenne l'Audience",
                no_changes_during: "Ne faites aucun changement pendant cette p\xE9riode",
                time_to_optimize: "Temps pour que Facebook Optimise les Co\xFBts",
                minor_changes_only: "Seuls des changements mineurs sont recommand\xE9s - les modifications majeures r\xE9initialisent l'apprentissage",
                based_on_cpm: "Bas\xE9 sur 40$ CPM, 1% CTR, 10% taux de conversion"
              }
            },
            google: {
              step_labels: {
                campaign_type: "Type de Campagne",
                budget: "Budget",
                location: "Emplacement",
                details: "D\xE9tails",
                phone: "T\xE9l\xE9phone",
                review: "V\xE9rification"
              },
              step_descriptions: {
                search_vs_pmax: "Recherche vs PMAX",
                daily_budget: "Budget Quotidien",
                target_location: "Zone Cible",
                website_custom_values: "Site Web et Valeurs Personnalis\xE9es",
                phone_number_optional: "Num\xE9ro de T\xE9l\xE9phone (Facultatif)",
                review_launch: "V\xE9rifier et Lancer"
              },
              campaign_types: {
                search: {
                  label: "Campagne de Recherche",
                  description: "Affichez des annonces textuelles aux personnes recherchant activement vos produits ou services sur Google. Id\xE9al pour capter les clients \xE0 forte intention pr\xEAts \xE0 agir. Vos annonces apparaissent en haut des r\xE9sultats de recherche."
                },
                pmax: {
                  label: "Performance Max",
                  description: "Atteignez les clients sur tous les canaux Google, y compris la Recherche, le Display, YouTube et plus, avec une seule campagne. Utilise l'IA pour optimiser automatiquement vos annonces. N\xE9cessite des images paysage (1.91:1) et carr\xE9es (1:1)."
                }
              },
              choose_campaign_type: "Choisissez votre type de campagne",
              choose_campaign_type_description: "S\xE9lectionnez comment vous souhaitez atteindre les clients sur Google",
              ai_powered: "Propuls\xE9 par l'IA",
              pmax_unavailable: "Performance Max indisponible :",
              pmax_unavailable_description: "Ce mod\xE8le ne prend en charge que les campagnes de Recherche. PMAX n\xE9cessite des images paysage (1.91:1) et carr\xE9es (1:1).",
              set_daily_budget: "D\xE9finissez votre budget quotidien",
              budget_question: "Combien souhaitez-vous d\xE9penser par jour pour votre annonce Google ?",
              budget_tip: "Nous recommandons au moins %{currency}50/jour pour donner \xE0 Google suffisamment de donn\xE9es pour optimiser votre campagne.",
              target_audience: "Ciblez votre Audience",
              target_audience_description: "Choisissez o\xF9 vous souhaitez que vos annonces apparaissent",
              campaign_details: "D\xE9tails de la Campagne",
              campaign_details_description: "Ajoutez votre site web et personnalisez votre campagne",
              website_url_heading: "URL du Site Web",
              website_url_description: "O\xF9 vos annonces doivent-elles diriger les gens ?",
              use_ez_page_description: "Utiliser une page de destination pr\xE9d\xE9finie",
              business_name_google_limit: "Google limite les noms d'entreprise \xE0 25 caract\xE8res",
              current_client_name: "Nom du client actuel :",
              characters: "caract\xE8res",
              customize_ad_content: "Personnalisez le contenu de l'annonce pour cette campagne",
              details_tip: "Assurez-vous que l'URL de votre site web fonctionne et est adapt\xE9e aux mobiles pour de meilleurs r\xE9sultats.",
              phone_title: "Num\xE9ro de T\xE9l\xE9phone",
              phone_description: "Ajoutez un num\xE9ro de t\xE9l\xE9phone pour que les clients puissent vous appeler directement depuis l'annonce",
              skip_step: "Passer cette \xE9tape",
              skip_phone_description: "Je ne souhaite pas ajouter de num\xE9ro de t\xE9l\xE9phone \xE0 cette campagne",
              phone_enter_description: "Entrez un num\xE9ro de t\xE9l\xE9phone o\xF9 les clients peuvent vous joindre",
              phone_benefit_tip: "Les annonces avec num\xE9ros de t\xE9l\xE9phone peuvent augmenter les appels jusqu'\xE0 8% et aider les clients \xE0 vous contacter plus rapidement.",
              phone_benefit_why: "Pourquoi ajouter un num\xE9ro de t\xE9l\xE9phone ?",
              review: {
                review_settings: "V\xE9rifiez les param\xE8tres de votre campagne avant le lancement",
                campaign_type: "Type de Campagne",
                website: "Site Web",
                phone_number: "Num\xE9ro de T\xE9l\xE9phone",
                custom_values: "Valeurs Personnalis\xE9es",
                select_media: "S\xE9lectionner les M\xE9dias",
                select_images: "S\xE9lectionner les Images",
                images_selected: "%{count} images s\xE9lectionn\xE9es",
                pmax_media_requirement: "PMAX n\xE9cessite au moins 1 image paysage (1.91:1) et 1 carr\xE9e (1:1)",
                required_media: "S\xE9lectionnez au moins 1 image paysage et 1 carr\xE9e pour lancer votre campagne Performance Max.",
                required_label: "Requis :"
              },
              validation: {
                select_valid_type: "Veuillez s\xE9lectionner un type de campagne valide",
                enter_website: "Veuillez entrer une URL de site web",
                enter_business_name: "Veuillez entrer un nom d'entreprise",
                business_name_length: "Le nom de l'entreprise doit contenir 25 caract\xE8res ou moins",
                pmax_media: "PMAX n\xE9cessite au moins 1 image paysage (1.91:1) et 1 carr\xE9e (1:1)",
                phone_too_short: "Le num\xE9ro de t\xE9l\xE9phone semble trop court"
              }
            }
          }
        }
      };
    }
  });

  // app/javascript/packs/campaign_builder_forms.js
  init_esbuild_jquery_shim();

  // app/javascript/shared/campaign_builder/accordion_manager.js
  init_esbuild_jquery_shim();
  var AccordionManager = class {
    constructor() {
      this.accordions = [];
    }
    init() {
      this.setupAccordionToggles();
      this.expandDefaultSections();
    }
    setupAccordionToggles() {
      document.querySelectorAll(".accordion-toggle").forEach((toggle) => {
        toggle.addEventListener("click", (e) => {
          e.preventDefault();
          this.toggleAccordion(toggle);
        });
      });
    }
    toggleAccordion(toggle) {
      const targetId = toggle.dataset.target;
      const content = document.querySelector(targetId);
      const icon = toggle.querySelector("svg");
      if (!content) return;
      const isHidden = content.classList.contains("hidden") || content.style.display === "none";
      if (isHidden) {
        content.classList.remove("hidden");
        icon?.classList.add("rotate-180");
      } else {
        content.classList.add("hidden");
        icon?.classList.remove("rotate-180");
      }
    }
    expandDefaultSections() {
      const firstToggle = document.querySelector(".accordion-toggle");
      if (firstToggle) {
        const targetId = firstToggle.dataset.target;
        if (targetId === "#advanced-settings-content" || targetId === "#leadgen-accordion-content") {
          return;
        }
        const content = document.querySelector(targetId);
        if (content) {
          content.classList.remove("hidden");
        }
      }
    }
    expandSection(sectionId) {
      const content = document.querySelector(sectionId);
      const toggle = document.querySelector(`[data-target="${sectionId}"]`);
      if (content && toggle) {
        content.classList.remove("hidden");
        toggle.querySelector("svg")?.classList.add("rotate-180");
      }
    }
    collapseSection(sectionId) {
      const content = document.querySelector(sectionId);
      const toggle = document.querySelector(`[data-target="${sectionId}"]`);
      if (content && toggle) {
        content.classList.add("hidden");
        toggle.querySelector("svg")?.classList.remove("rotate-180");
      }
    }
  };
  var accordionManager = new AccordionManager();

  // app/javascript/shared/campaign_builder/custom_variables_handler.js
  init_esbuild_jquery_shim();
  var CustomVariablesHandler = class {
    constructor() {
      this.customVariables = [];
      this.landingPageVariables = [];
    }
    init() {
      this.cacheElements();
      this.setupEventListeners();
      this.validateRequiredFields();
    }
    cacheElements() {
      this.mainDiv = document.getElementById("main_div_landing_page");
      this.lpVariableDiv = document.getElementById("lp_custom_variable");
      this.customVariableInputs = document.querySelectorAll(".custom-variable");
      this.lpVariableInputs = document.querySelectorAll(".custom-variable-lp");
    }
    setupEventListeners() {
      document.addEventListener("campaignTypeChanged", (e) => {
        this.handleCampaignTypeChange(e.detail);
      });
      this.customVariableInputs.forEach((input) => {
        input.addEventListener("blur", () => this.validateField(input));
      });
      this.lpVariableInputs.forEach((input) => {
        input.addEventListener("blur", () => this.validateField(input));
      });
    }
    handleCampaignTypeChange(campaignType) {
      const isLandingPage = campaignType === "ezy-click-campaign";
      if (isLandingPage) {
        this.showLandingPageVariables();
        this.hideCustomVariables();
      } else {
        this.showCustomVariables();
        this.hideLandingPageVariables();
      }
      this.updateRequiredFields(isLandingPage);
    }
    showLandingPageVariables() {
      if (this.lpVariableDiv) {
        this.lpVariableDiv.classList.remove("hidden");
        this.mainDiv.classList.remove("hidden");
      }
    }
    hideLandingPageVariables() {
      if (this.lpVariableDiv) {
        this.lpVariableDiv.classList.add("hidden");
        const customVariablesContent = document.getElementById("custom-variables-content");
        if (!customVariablesContent) return;
        const allInputs = customVariablesContent.querySelectorAll("input.custom-variable");
        const inputsOutsideLP = Array.from(allInputs).filter((input) => !this.lpVariableDiv.contains(input));
        if (inputsOutsideLP.length === 0) {
          this.mainDiv.classList.add("hidden");
        }
      }
    }
    showCustomVariables() {
      if (this.mainDiv) {
        this.mainDiv.classList.remove("hidden");
      }
    }
    hideCustomVariables() {
      const hasCustomVars = document.querySelector('[name*="custom_variables"]');
      if (this.mainDiv && !hasCustomVars) {
        this.mainDiv.classList.add("hidden");
      }
    }
    updateRequiredFields(isLandingPage) {
      this.customVariableInputs.forEach((input) => {
        input.removeAttribute("required");
      });
      this.lpVariableInputs.forEach((input) => {
        input.removeAttribute("required");
      });
      if (isLandingPage) {
        this.lpVariableInputs.forEach((input) => {
          input.setAttribute("required", "required");
        });
      } else {
        this.customVariableInputs.forEach((input) => {
          if (!input.classList.contains("custom-variable-lp")) {
            input.setAttribute("required", "required");
          }
        });
      }
    }
    validateField(input) {
      const value = input.value.trim();
      const isRequired = input.hasAttribute("required");
      if (isRequired && !value) {
        this.showFieldError(input, "This field is required");
        return false;
      }
      this.clearFieldError(input);
      return true;
    }
    validateRequiredFields() {
      let isValid = true;
      document.querySelectorAll(".custom-variable[required]").forEach((input) => {
        if (!this.validateField(input)) {
          isValid = false;
        }
      });
      return isValid;
    }
    showFieldError(input, message) {
      input.classList.add("border-red-500");
      const existingError = input.parentElement.querySelector(".field-error");
      if (existingError) {
        existingError.remove();
      }
      const errorEl = document.createElement("span");
      errorEl.className = "field-error text-red-500 text-xs mt-1";
      errorEl.textContent = message;
      input.parentElement.appendChild(errorEl);
    }
    clearFieldError(input) {
      input.classList.remove("border-red-500");
      const error = input.parentElement.querySelector(".field-error");
      if (error) {
        error.remove();
      }
    }
    getVariableValues() {
      const values = {};
      this.customVariableInputs.forEach((input) => {
        if (input.value) {
          values[input.dataset.name || input.name] = input.value;
        }
      });
      return values;
    }
  };
  var customVariablesHandler = new CustomVariablesHandler();

  // app/javascript/shared/campaign_builder/audience_estimator.js
  init_esbuild_jquery_shim();

  // app/javascript/shared/campaign_builder/location_params_extractor.js
  init_esbuild_jquery_shim();
  var LOCATION_TYPES = ["addresses", "cities", "countries", "regions", "zips", "neighborhoods"];
  function extractLocationParams(form) {
    const results = {};
    const items = form.querySelectorAll(".location-item");
    items.forEach((item) => {
      const type = item.dataset.template;
      if (!LOCATION_TYPES.includes(type)) return;
      const entry = {};
      item.querySelectorAll(`input[name^="remote_campaign_builder_job[${type}]"]`).forEach((input) => {
        const match = input.name.match(/\[\]\[(.+?)\]$/);
        if (match) {
          entry[match[1]] = input.value;
        }
      });
      item.querySelectorAll(`select[name^="remote_campaign_builder_job[${type}]"]`).forEach((select) => {
        const match = select.name.match(/\[\]\[(.+?)\]$/);
        if (!match) return;
        const key = match[1];
        if (!select.disabled || entry[key] === void 0) {
          entry[key] = select.value;
        }
      });
      const distanceUnitInput = item.querySelector(".distance-unit-input");
      if (distanceUnitInput && distanceUnitInput.value && !entry.distance_unit) {
        entry.distance_unit = distanceUnitInput.value;
      }
      if (!entry.radius) {
        const activeRadius = Array.from(item.querySelectorAll(".radius-input-mile, .radius-input-km")).find((select) => !select.disabled && !select.classList.contains("hidden"));
        if (activeRadius) {
          entry.radius = activeRadius.value;
        }
      }
      if (entry.radius !== void 0) {
        const parsedRadius = parseInt(entry.radius, 10);
        if (Number.isFinite(parsedRadius)) {
          entry.radius = parsedRadius;
        }
      }
      ["latitude", "longitude"].forEach((coordKey) => {
        if (entry[coordKey] !== void 0) {
          const parsed = parseFloat(entry[coordKey]);
          if (Number.isFinite(parsed)) {
            entry[coordKey] = parsed;
          }
        }
      });
      Object.keys(entry).forEach((key) => {
        if (entry[key] === "" || entry[key] === void 0 || entry[key] === null) {
          delete entry[key];
        }
      });
      if (Object.keys(entry).length === 0) return;
      if (type === "addresses" && (!Number.isFinite(entry.latitude) || !Number.isFinite(entry.longitude))) {
        return;
      }
      if (!results[type]) {
        results[type] = [];
      }
      results[type].push(entry);
    });
    return results;
  }

  // app/javascript/shared/campaign_builder/audience_estimator_api.js
  init_esbuild_jquery_shim();
  async function fetchEstimate(targetingData) {
    const { adAccountId, ...params } = targetingData;
    if (!adAccountId) throw new Error("Ad account ID is required for audience estimates");
    const query = buildQueryString(params);
    const url = query.length > 0 ? `/reach_estimates/${encodeURIComponent(adAccountId)}?${query}` : `/reach_estimates/${encodeURIComponent(adAccountId)}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      credentials: "same-origin"
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("Unable to parse audience estimate response");
    }
    if (result.error === "deprecated_interests") {
      return {
        error: "deprecated_interests",
        message: result.message || "Some targeting interests have been deprecated",
        deprecatedInterests: result.deprecated_interests || []
      };
    }
    if (!response.ok) {
      throw new Error(result?.message || "Unable to fetch audience estimate");
    }
    const lower = Number(result.lower);
    const upper = Number(result.upper);
    if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
      throw new Error(result.message || "Audience estimate unavailable");
    }
    return { lower, upper };
  }
  function buildQueryString(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      appendParam(searchParams, key, value);
    });
    return searchParams.toString();
  }
  function appendParam(searchParams, key, value) {
    if (value === void 0 || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        appendParam(searchParams, `${key}[${index}]`, item);
      });
      return;
    }
    if (typeof value === "object") {
      Object.entries(value).forEach(([childKey, childValue]) => {
        appendParam(searchParams, `${key}[${childKey}]`, childValue);
      });
      return;
    }
    searchParams.append(key, value);
  }

  // app/javascript/shared/campaign_builder/audience_estimator.js
  var AudienceEstimator = class {
    constructor() {
      this.updateButton = null;
      this.sizeElement = null;
      this.refreshText = null;
      this.isUpdating = false;
    }
    init() {
      this.cacheElements();
      this.setupEventListeners();
      this.displayInitialEstimate();
    }
    cacheElements() {
      this.updateButton = document.getElementById("update-reach-estimate-btn");
      this.sizeElement = document.querySelector("#reach-estimate .size");
      this.refreshText = document.querySelector(".refresh-text");
      this.loadingIcon = document.querySelector(".loading-icon");
      this.readyIcon = document.querySelector(".ready-icon");
    }
    setupEventListeners() {
      if (this.updateButton) this.updateButton.addEventListener("click", () => this.updateEstimate());
      document.addEventListener("locationChanged", () => this.showRefreshHint());
      document.addEventListener("targetingChanged", () => this.showRefreshHint());
    }
    displayInitialEstimate() {
      if (!this.sizeElement) return;
      const lower = Number(this.sizeElement.dataset.lower);
      const upper = Number(this.sizeElement.dataset.upper);
      const isValid = Number.isFinite(lower) && Number.isFinite(upper);
      this.updateDisplay(isValid ? lower : 0, isValid ? upper : 0);
    }
    updateDisplay(lower, upper) {
      if (!this.sizeElement) return;
      this.sizeElement.classList.remove("text-red-500", "text-amber-500");
      if (lower === 0 && upper === 0) {
        this.sizeElement.textContent = "Not available";
      } else {
        this.sizeElement.textContent = `${this.formatNumber(lower)} - ${this.formatNumber(upper)}`;
        this.sizeElement.dataset.lower = lower;
        this.sizeElement.dataset.upper = upper;
      }
    }
    formatNumber(num) {
      if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
      if (num >= 1e3) return (num / 1e3).toFixed(0) + "K";
      return num.toString();
    }
    showRefreshHint() {
      if (this.refreshText) this.refreshText.classList.remove("hidden");
    }
    hideRefreshHint() {
      if (this.refreshText) this.refreshText.classList.add("hidden");
    }
    async updateEstimate() {
      if (this.isUpdating) return;
      this.isUpdating = true;
      this.showLoadingState();
      try {
        const data = this.collectTargetingData();
        const estimate = await fetchEstimate(data);
        if (estimate) {
          if (estimate.error === "deprecated_interests") {
            this.showDeprecatedInterestsWarning(estimate.message);
            return;
          }
          this.updateDisplay(estimate.lower, estimate.upper);
          this.hideRefreshHint();
        }
      } catch (error) {
        console.error("Failed to update audience estimate:", error);
        this.showError(error?.message);
      } finally {
        this.hideLoadingState();
        this.isUpdating = false;
      }
    }
    collectTargetingData() {
      const form = document.getElementById("campaign_builder_form");
      if (!form) throw new Error("Campaign builder form not found");
      const adAccountId = form.querySelector('[name="remote_campaign_builder_job[ad_account_id]"]')?.value;
      const agencyId = form.querySelector('[name="remote_campaign_builder_job[agency_uuid]"]')?.value;
      const templateId = form.querySelector('[name="remote_campaign_builder_job[template_id]"]')?.value;
      if (!adAccountId || !agencyId || !templateId) throw new Error("Missing data required to refresh audience size");
      const payload = { adAccountId, agency_id: agencyId, template_id: templateId };
      const audienceSelect = form.querySelector('[name="remote_campaign_builder_job[audiences]"]');
      if (audienceSelect?.value) payload.audiences = audienceSelect.value;
      const distanceUnitInput = form.querySelector('[name="remote_campaign_builder_job[distance_unit]"]');
      if (distanceUnitInput?.value) payload.distance_unit = distanceUnitInput.value;
      const radiusInput = form.querySelector('[name="remote_campaign_builder_job[radius]"]');
      if (radiusInput?.value) payload.radius = radiusInput.value;
      Object.assign(payload, extractLocationParams(form));
      return payload;
    }
    // Public API — delegates to extracted module. Used by audience_insights_controller.
    fetchEstimate(data) {
      return fetchEstimate(data);
    }
    showLoadingState() {
      if (this.loadingIcon) this.loadingIcon.classList.remove("hidden");
      if (this.readyIcon) this.readyIcon.classList.add("hidden");
      if (this.updateButton) this.updateButton.disabled = true;
    }
    hideLoadingState() {
      if (this.loadingIcon) this.loadingIcon.classList.add("hidden");
      if (this.readyIcon) this.readyIcon.classList.remove("hidden");
      if (this.updateButton) this.updateButton.disabled = false;
    }
    showError(message) {
      if (!this.sizeElement) return;
      this.sizeElement.textContent = message || "Error loading estimate";
      this.sizeElement.classList.add("text-red-500");
    }
    showDeprecatedInterestsWarning(message) {
      if (!this.sizeElement) return;
      this.sizeElement.textContent = message || "Some targeting interests have been deprecated";
      this.sizeElement.classList.add("text-amber-500");
      this.sizeElement.classList.remove("text-red-500");
    }
  };
  var audienceEstimator = new AudienceEstimator();

  // app/javascript/shared/campaign_form_handler.js
  init_esbuild_jquery_shim();

  // app/javascript/shared/csrf.js
  init_esbuild_jquery_shim();
  function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content || "";
  }

  // app/javascript/shared/campaign_modal_manager.js
  init_esbuild_jquery_shim();
  var CampaignModalManager = class {
    constructor() {
      this.pollInterval = null;
      this.modalElement = null;
    }
    // Initialize the modal with loading state
    showLoadingModal() {
      const content = this.getLoadingTemplate();
      this.updateModalContent(content);
      this.showModal();
    }
    // Show error state in modal
    // options: { requiresReauthentication: boolean, adsManagerUrl: string }
    showErrorModal(message, details = null, onRetry = null, options = {}) {
      if (options.requiresReauthentication && this.shouldShowReauthenticationLink()) {
        this.showFlobReconnectForm();
        return;
      }
      const content = this.getErrorTemplate(message, details, onRetry);
      this.updateModalContent(content);
    }
    // Show success state in modal
    showSuccessModal(campaignName, budget, status) {
      const content = this.getSuccessTemplate(campaignName, budget, status);
      this.updateModalContent(content);
    }
    // Show simple success message (for drafts, etc)
    showSimpleSuccessModal(title, message) {
      const content = `
      <div class="text-center">
        <div class="mt-6 mb-4 flex justify-center">
          <svg class="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="mt-3 sm:mt-5">
          <h3 class="text-2xl leading-6 font-bold text-green-600 mb-4">${title}</h3>
          <div class="mt-2">
            <p class="dark:text-gray-300 text-md text-gray-700">${message}</p>
          </div>
        </div>
      </div>
    `;
      this.updateModalContent(content);
    }
    // Update modal content
    updateModalContent(content) {
      const modalContent = document.getElementById("campaign-builder-modal-content");
      if (modalContent) {
        modalContent.innerHTML = content;
      }
    }
    // Show the modal
    showModal() {
      this.modalElement = document.getElementById("campaign-builder-modal");
      if (this.modalElement) {
        this.modalElement.classList.remove("hidden");
      }
    }
    // Show the pre-rendered FLoB reconnect form
    showFlobReconnectForm() {
      const modalContent = document.getElementById("campaign-builder-modal-content");
      const flobContainer = document.getElementById("campaign-builder-flob-container");
      if (modalContent) modalContent.classList.add("hidden");
      if (flobContainer) flobContainer.classList.remove("hidden");
    }
    // Reset both containers to default visibility
    resetContainerStates() {
      const modalContent = document.getElementById("campaign-builder-modal-content");
      const flobContainer = document.getElementById("campaign-builder-flob-container");
      if (modalContent) {
        modalContent.classList.remove("hidden");
        modalContent.innerHTML = "";
      }
      if (flobContainer) flobContainer.classList.add("hidden");
    }
    // Hide the modal
    hideModal() {
      const modal = this.modalElement || document.getElementById("campaign-builder-modal");
      if (modal) {
        modal.classList.add("hidden");
      }
      this.resetContainerStates();
      this.stopPolling();
    }
    // Stop any active polling
    stopPolling() {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    }
    // Get loading template HTML
    getLoadingTemplate() {
      return `
      <div class="text-center">
        <h3 class="dark:text-gray-300 text-2xl leading-6 font-bold text-gray-900 mb-4">
          Hang Tight!
        </h3>
        <div class="mt-2">
          <p class="dark:text-white text-md text-gray-500" id="campaign-message">
            Your campaign is being launched!
          </p>
          <span class="text-sm text-yellow-500">
            Please keep this dialog open until your campaign is complete!
          </span>
        </div>

        <div class="mt-6 mb-4 flex justify-center">
          ${this.getProgressSpinner()}
        </div>

        <div class="mt-4 text-center">
          <p class="dark:text-gray-300 text-sm text-gray-500 campaign-status-text">
            Getting ready to launch your campaign
          </p>
        </div>
      </div>
    `;
    }
    // Get error template HTML
    getErrorTemplate(message, details = null, onRetry = null) {
      return `
      <div class="text-center">
        <div class="mt-6 mb-4 flex justify-center">
          ${this.getErrorIcon()}
        </div>
        <div class="mt-3 sm:mt-5">
          <h3 class="text-2xl leading-6 font-bold text-red-600 mb-4">Error!</h3>
          <div class="mt-2">
            <p class="dark:text-gray-300 text-xl font-medium leading-6 text-gray-900 mb-4">
              Campaign launch was unsuccessful.
            </p>
          </div>
        </div>

        <div class="mt-4 p-4">
          <p class="dark:text-gray-300 text-sm font-medium text-gray-500 mb-2">Reason:</p>
          <p class="dark:text-gray-300 text-sm text-gray-900">${message}</p>
        </div>

        ${details ? `
          <div class="mt-4 p-4">
            <p class="dark:text-gray-300 text-sm font-medium text-gray-500 mb-2">Details:</p>
            <p class="dark:text-gray-300 text-sm text-gray-900">${details}</p>
          </div>
        ` : ""}

        <div class="mt-6 flex justify-center gap-4">
          <button type="button"
                  class="px-6 py-2 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50"
                  onclick="window.campaignModal.hideModal()">
            Go Back
          </button>
          ${onRetry ? `
            <button type="button"
                    class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    onclick="${onRetry}">
              Retry
            </button>
          ` : ""}
        </div>
      </div>
    `;
    }
    // Get success template HTML
    getSuccessTemplate(campaignName, budget, status) {
      return `
      <div class="text-center">
        <div class="mt-6 mb-4 flex justify-center">
          ${this.getSuccessIcon()}
        </div>
        <div class="mt-3 sm:mt-5">
          <h3 class="text-2xl leading-6 font-bold text-green-600 mb-4">Success!</h3>
          <p class="dark:text-gray-300 text-xl font-medium leading-6 text-gray-900">
            Your campaign was created successfully.
          </p>
        </div>

        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt class="truncate text-sm font-medium text-gray-500">Campaign Name</dt>
            <dd class="mt-1 font-semibold tracking-tight text-gray-900">${campaignName}</dd>
          </div>
          <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt class="truncate text-sm font-medium text-gray-500">Daily Budget</dt>
            <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900">$${budget}</dd>
          </div>
          <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt class="truncate text-sm font-medium text-gray-500">Status</dt>
            <dd class="mt-1 text-lg font-semibold tracking-tight text-gray-900">${status}</dd>
          </div>
        </dl>

        <div class="mt-6">
          <button type="button"
                  class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  onclick="window.campaignModal.hideModal()">
            Close
          </button>
        </div>
      </div>
    `;
    }
    // Get progress spinner SVG
    getProgressSpinner() {
      return `
      <svg class="w-16 h-16" viewBox="0 0 36 36">
        <path class="circle-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="#e6e6e6" stroke-width="2" />
        <path class="circle loading-spinner"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="#4a90e2" stroke-width="2" stroke-dasharray="25, 100" />
        <text x="18" y="20.35" class="percentage" fill="#4a90e2" text-anchor="middle" font-size="8">0%</text>
      </svg>
    `;
    }
    // Get error icon SVG
    getErrorIcon() {
      return `
      <svg xmlns="http://www.w3.org/2000/svg" width="66" height="64" viewBox="0 0 66 64" fill="none">
        <path d="M27.6264 3.00842C30.965 1.1393 35.035 1.1393 38.3736 3.00842L55.9524 12.85C59.4269 14.7952 61.5788 18.4663 61.5788 22.4482V41.5518C61.5788 45.5337 59.4269 49.2048 55.9524 51.15L38.3736 60.9916C35.035 62.8607 30.965 62.8607 27.6264 60.9916L10.0476 51.15C6.57312 49.2048 4.42116 45.5337 4.42116 41.5518V22.4482C4.42116 18.4663 6.57312 14.7952 10.0476 12.85L27.6264 3.00842Z" fill="#DC6803"/>
        <g clip-path="url(#clip0_error)">
          <path d="M32.5 20C25.883 20 20.5 25.383 20.5 32C20.5 38.617 25.883 44 32.5 44C39.117 44 44.5 38.617 44.5 32C44.5 25.383 39.117 20 32.5 20ZM31.5 27C31.5 26.447 31.947 26 32.5 26C33.053 26 33.5 26.447 33.5 27V33C33.5 33.553 33.053 34 32.5 34C31.947 34 31.5 33.553 31.5 33V27ZM32.5 38.5C31.81 38.5 31.25 37.94 31.25 37.25C31.25 36.56 31.81 36 32.5 36C33.19 36 33.75 36.56 33.75 37.25C33.75 37.94 33.19 38.5 32.5 38.5Z" fill="white"/>
        </g>
      </svg>
    `;
    }
    // Get success icon SVG
    getSuccessIcon() {
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-16 h-16 text-green-500">
        <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
      </svg>
    `;
    }
    // Update progress percentage
    updateProgress(percentage) {
      const percentageText = document.querySelector(".percentage");
      if (percentageText) {
        percentageText.textContent = `${percentage}%`;
      }
    }
    // Update status text
    updateStatusText(status) {
      const statusText = document.querySelector(".campaign-status-text");
      if (statusText) {
        statusText.textContent = this.getHumanReadableStatus(status);
      }
    }
    // Get human-readable status
    getHumanReadableStatus(status) {
      const statusMap = {
        "unstarted": "Getting ready to launch your campaign",
        "uploading-media": "Uploading your media files",
        "info-prepared": "Preparing campaign information",
        "media-processed": "Processing media files",
        "finished": "Campaign launched successfully",
        "failed": "Campaign launch failed",
        "in_progress": "Campaign is being created",
        "draft": "Campaign saved as draft",
        "scheduled": "Campaign scheduled for launch"
      };
      return statusMap[status] || status;
    }
    // Check if reauthentication link should be shown in modal
    shouldShowReauthenticationLink() {
      const modal = document.getElementById("campaign-builder-modal");
      if (!modal) return true;
      const showLink = modal.dataset.showReauthenticationLink;
      return showLink !== "false";
    }
  };
  var campaignModal = window.campaignModal || new CampaignModalManager();
  window.campaignModal = campaignModal;

  // app/javascript/shared/campaign_polling.js
  init_esbuild_jquery_shim();

  // app/javascript/shared/session_context.js
  init_esbuild_jquery_shim();
  function isLauncherSessionPath(pathname = window.location.pathname) {
    return /^\/launcher(?:\/|$)/.test(pathname);
  }

  // app/javascript/shared/campaign_polling.js
  var CampaignPolling = class {
    constructor() {
      this.pollInterval = null;
      this.pollDelay = 3e3;
    }
    // Start polling for campaign status
    startPolling(options) {
      const {
        url,
        onSuccess,
        onError,
        onFinished,
        onFailed
      } = options;
      this.stopPolling();
      this.pollInterval = setInterval(() => {
        this.checkStatus(url, onSuccess, onError, onFinished, onFailed);
      }, this.pollDelay);
    }
    // Check campaign status once
    async checkStatus(url, onSuccess, onError, onFinished, onFailed) {
      try {
        const response = await fetch(url, {
          headers: {
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        campaignModal.updateStatusText(data.status);
        campaignModal.updateProgress(data.progress_percentage || 0);
        if (data.status === "failed" || data.error_message) {
          this.stopPolling();
          if (onFailed) {
            onFailed(data);
          } else {
            campaignModal.showErrorModal(
              data.error_message || "Campaign launch failed",
              data.error_details
            );
          }
        } else if (data.status === "finished") {
          this.stopPolling();
          if (onFinished) {
            onFinished(data);
          }
        } else if (onSuccess) {
          onSuccess(data);
        }
      } catch (error) {
        console.error("Polling error:", error);
        this.stopPolling();
        if (onError) {
          onError(error);
        } else {
          campaignModal.showErrorModal("Failed to check campaign status");
        }
      }
    }
    // Stop polling
    stopPolling() {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
      campaignModal.stopPolling();
    }
    // Build polling URL based on context
    buildPollingUrl(context, campaignBuilderId) {
      const { agencyId, clientId, locationId, templateId, platform } = context;
      const isClientSession = isLauncherSessionPath();
      if (isClientSession) {
        return `/launcher/campaign_builders/${campaignBuilderId}`;
      } else if (agencyId && locationId && templateId) {
        return `/agencies/${agencyId}/${locationId}/${templateId}/campaign_builders/${campaignBuilderId}?platform=${platform}`;
      } else if (clientId) {
        return `/clients/${clientId}/campaign_builders/${campaignBuilderId}`;
      }
      throw new Error("Invalid context for polling URL");
    }
    // Helper to start polling with context
    startContextPolling(campaignBuilderId, context, redirectOnSuccess = true) {
      const url = this.buildPollingUrl(context, campaignBuilderId);
      const isClientSession = isLauncherSessionPath();
      this.startPolling({
        url,
        onFinished: (data) => {
          if (redirectOnSuccess) {
            if (isClientSession) {
              window.location.href = `/launcher/campaign_builders/${campaignBuilderId}`;
            } else if (context.agencyId) {
              window.location.href = `/agencies/${context.agencyId}/${context.locationId}/${context.templateId}/campaign_builders/${campaignBuilderId}?platform=${context.platform}`;
            } else {
              window.location.href = `/clients/${context.clientId}/campaign_builders/${campaignBuilderId}`;
            }
          } else {
            campaignModal.showSuccessModal(
              data.campaign_name || "Campaign",
              data.budget || "0",
              data.status || "Active"
            );
          }
        },
        onFailed: (data) => {
          campaignModal.showErrorModal(
            data.error_message || "Campaign launch failed",
            data.error_details,
            "retryFormSubmission()",
            {
              requiresReauthentication: data.requires_reauthentication,
              adsManagerUrl: data.ads_manager_url
            }
          );
        }
      });
    }
  };
  var campaignPolling = new CampaignPolling();
  window.campaignPolling = campaignPolling;

  // app/javascript/shared/notification.js
  init_esbuild_jquery_shim();

  // app/javascript/shared/error.js
  init_esbuild_jquery_shim();
  function extractErrorMessage(error, defaultMessage = "An unexpected error occurred") {
    if (error == null) {
      return defaultMessage;
    }
    if (error instanceof Error || typeof error === "object" && "message" in error) {
      return error.message || defaultMessage;
    }
    if (typeof error === "string") {
      return error;
    }
    if (typeof error === "object" && "error" in error) {
      return extractErrorMessage(error.error, defaultMessage);
    }
    try {
      const stringified = String(error);
      if (stringified && !stringified.startsWith("[object")) {
        return stringified;
      }
    } catch (e) {
    }
    return defaultMessage;
  }

  // app/javascript/shared/notification.js
  function showNotification(message, type = "success") {
    const displayMessage = typeof message === "string" ? message : type === "error" ? extractErrorMessage(message, "An unexpected error occurred") : String(message);
    let colors;
    switch (type) {
      case "success":
        colors = { bg: "bg-green-100", border: "border-green-500", text: "text-green-700", icon: "text-green-500" };
        break;
      case "info":
        colors = { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-700", icon: "text-blue-500" };
        break;
      case "warning":
        colors = { bg: "bg-yellow-100", border: "border-yellow-500", text: "text-yellow-700", icon: "text-yellow-500" };
        break;
      case "error":
      default:
        colors = { bg: "bg-red-100", border: "border-red-500", text: "text-red-700", icon: "text-red-500" };
        break;
    }
    const notificationDiv = document.createElement("div");
    notificationDiv.className = `fixed top-4 right-4 ${colors.bg} border-l-4 ${colors.border} ${colors.text} p-4 rounded shadow-md transition-all duration-500 transform translate-x-0 max-w-xl`;
    notificationDiv.style.zIndex = "10001";
    notificationDiv.setAttribute("data-notification", "true");
    const flexDiv = document.createElement("div");
    flexDiv.className = "flex";
    const iconDiv = document.createElement("div");
    iconDiv.className = "flex-shrink-0";
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", `h-5 w-5 ${colors.icon}`);
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.setAttribute("fill", "currentColor");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("fill-rule", "evenodd");
    path.setAttribute("clip-rule", "evenodd");
    if (type === "success") {
      path.setAttribute("d", "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z");
    } else if (type === "info") {
      path.setAttribute("d", "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z");
    } else if (type === "warning") {
      path.setAttribute("d", "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z");
    } else {
      path.setAttribute("d", "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z");
    }
    svg.appendChild(path);
    iconDiv.appendChild(svg);
    const messageDiv = document.createElement("div");
    messageDiv.className = "ml-3";
    const messageP = document.createElement("p");
    messageP.className = "text-sm whitespace-pre-line";
    messageP.textContent = displayMessage;
    messageDiv.appendChild(messageP);
    flexDiv.appendChild(iconDiv);
    flexDiv.appendChild(messageDiv);
    notificationDiv.appendChild(flexDiv);
    document.body.appendChild(notificationDiv);
    const dismissTime = type === "error" || type === "warning" ? 15e3 : 5e3;
    setTimeout(() => {
      notificationDiv.classList.add("translate-x-full", "opacity-0");
      setTimeout(() => notificationDiv.remove(), 500);
    }, dismissTime);
  }
  window.addEventListener("show-notification", (event) => {
    const { message, type } = event.detail || {};
    if (message) {
      showNotification(message, type);
    } else {
      console.warn("show-notification event triggered without a message.");
    }
  });

  // app/javascript/shared/campaign_form_handler.js
  var CampaignFormHandler = class {
    constructor() {
      this.formElement = null;
      this.submitButton = null;
      this.isSubmitting = false;
    }
    // Initialize form handler
    init(formId = "campaign_builder_form") {
      this.formElement = document.getElementById(formId);
      if (!this.formElement) {
        console.warn("Campaign builder form not found");
        return;
      }
      this.findSubmitButton();
      this.attachEventListeners();
    }
    // Find and cache submit button
    findSubmitButton() {
      const platform = this.getPlatform();
      if (platform === "google") {
        this.submitButton = document.querySelector(".google_submit_btn");
      } else {
        this.submitButton = document.querySelector(".facebook_submit_btn");
      }
    }
    // Get platform from form
    getPlatform() {
      const platformField = document.getElementById("remote_campaign_builder_job_platform");
      return platformField ? platformField.value : "facebook";
    }
    // Check if preflight checks are enabled via env var (default: disabled)
    isPreflightChecksEnabled() {
      return window.UpHex?.features?.facebookPreflightChecksEnabled === true;
    }
    // Attach event listeners
    attachEventListeners() {
      if (this.formElement && !this.formElement.dataset.formHandlerBound) {
        this.formElement.dataset.formHandlerBound = "true";
        this.formElement.addEventListener("submit", (e) => {
          if (this.shouldHandleAsAjax()) {
            e.preventDefault();
            this.submitForm();
          }
        });
      }
    }
    // Check if form should be handled as AJAX
    shouldHandleAsAjax() {
      const platform = this.getPlatform();
      return platform === "google" || this.formElement.dataset.ajax === "true";
    }
    validateAwarenessTypeCampaign() {
      const campaignTypeEl = document.getElementById("remote_campaign_builder_job_campaign_type");
      if (!campaignTypeEl) return true;
      const campaignType = campaignTypeEl.value;
      if (campaignType !== "brand_awareness") return true;
      const checkedMedia = document.querySelectorAll(".media-checkbox:checked");
      if (checkedMedia.length > 0) {
        for (const cb of checkedMedia) {
          const videoUrl = cb.dataset.videoUrl;
          if (!videoUrl || videoUrl.trim() === "") {
            showNotification("For Video Views campaigns, only videos can be selected as media.", "error");
            return false;
          }
        }
        return true;
      } else {
        const allMedia = document.querySelectorAll('.media-checkbox[data-source="template"]');
        const videoMedia = Array.from(allMedia).filter((cb) => {
          const videoUrl = cb.dataset.videoUrl;
          return videoUrl && videoUrl.trim() !== "";
        });
        if (videoMedia.length > 0) {
          videoMedia.forEach((cb) => cb.click());
          const applyBtn = document.getElementById("apply-media-button");
          if (applyBtn) applyBtn.click();
          return true;
        } else {
          showNotification("For Video Views campaigns, you must select/upload at least one video as media.", "error");
          return false;
        }
      }
    }
    async runFacebookPreflightChecks() {
      campaignModal.showLoadingModal(
        "Validating your ad account...",
        "Please wait while we run Facebook checks."
      );
      const baseUrl = this.formElement.action.replace(/\.json$/, "");
      const endpoints = [
        `${baseUrl}/check_permissions`,
        `${baseUrl}/check_restrictions`,
        `${baseUrl}/check_payment_method`,
        `${baseUrl}/check_lead_ads_tos`,
        `${baseUrl}/check_nondiscriminatory_policy`
      ].map((url) => fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest", "Accept": "application/json" } }));
      const results = await Promise.allSettled(endpoints);
      let errors = [];
      for (const result of results) {
        if (result.status === "fulfilled") {
          const json = await result.value.json();
          if (json.status === "fail") {
            errors = errors.concat(json.errors);
          }
        } else {
          errors.push({
            type: "network",
            message: "Could not complete validation (network issue)."
          });
        }
      }
      if (errors.length === 0) {
        return true;
      }
      campaignModal.showErrorModal(
        "Validation Failed",
        errors.map((e) => {
          const link = e.fix_url ? `<a href="${e.fix_url}" target="_blank" class="text-blue-600 dark:text-blue-400 underline text-sm mt-2 inline-block">
                Fix on Facebook \u2192
              </a>` : "";
          return `
            <div class="mb-4 p-4 rounded-md border
                        bg-gray-50 dark:bg-gray-800
                        border-gray-200 dark:border-gray-700">
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                ${e.message}
              </p>

              ${link}
            </div>
          `;
        }).join("")
      );
      return false;
    }
    validateAdImages() {
      const campaignType = document.getElementById("remote_campaign_builder_job_campaign_type")?.value;
      if (campaignType !== "pmax") return true;
      if (window.selectedImages && window.selectedImages.length > 0) return true;
      const form = this.formElement;
      const formData = new FormData(form);
      const imageFields = [
        "remote_campaign_builder_job[ad_images][]",
        "remote_campaign_builder_job[landscape_images][]",
        "remote_campaign_builder_job[square_images][]"
      ];
      let hasAdImages = false;
      for (const [key, value] of formData.entries()) {
        if (imageFields.includes(key) && value) {
          hasAdImages = true;
          break;
        }
      }
      if (!hasAdImages) {
        window.dispatchEvent(
          new CustomEvent("show-notification", {
            detail: {
              message: "Please select at least one ad image for PMax campaigns.",
              type: "error"
            }
          })
        );
        this.resetSubmitButton();
        return false;
      }
      return true;
    }
    validateGoogleSearchNetwork() {
      const platform = this.getPlatform();
      if (platform !== "google") return true;
      const campaignType = document.getElementById("remote_campaign_builder_job_campaign_type")?.value;
      if (campaignType !== "search") return true;
      const templateTargetingData = this.formElement?.dataset?.templateTargeting;
      if (!templateTargetingData) return true;
      let templateTargeting;
      try {
        templateTargeting = JSON.parse(templateTargetingData);
      } catch (e) {
        console.warn("Failed to parse template targeting data:", e);
        return true;
      }
      const googleSearchNetworks = templateTargeting?.google_search_networks;
      if (!googleSearchNetworks) return true;
      const googleSearchNetwork = googleSearchNetworks.google_search_network;
      const isDisabled = googleSearchNetwork === "0" || googleSearchNetwork === false || googleSearchNetwork === 0;
      if (isDisabled) {
        window.dispatchEvent(
          new CustomEvent("show-notification", {
            detail: {
              message: "You cannot launch a Search campaign when Google Search Network is unchecked. Please enable Google Search Network in your template settings.",
              type: "warning"
            }
          })
        );
        this.resetSubmitButton();
        return false;
      }
      return true;
    }
    // Submit form via AJAX
    async submitForm(retryMode = false) {
      if (this.isSubmitting) return;
      this.isSubmitting = true;
      if (!this.validateAwarenessTypeCampaign()) {
        this.isSubmitting = false;
        return;
      }
      if (!this.validateAdImages()) {
        this.isSubmitting = false;
        return;
      }
      if (!this.validateGoogleSearchNetwork()) {
        this.isSubmitting = false;
        return;
      }
      document.querySelectorAll(".js-submit-campaign").forEach((el) => el.textContent = "Launching...");
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("platform") === "facebook" && this.isPreflightChecksEnabled()) {
        const validationsPassed = await this.runFacebookPreflightChecks();
        if (!validationsPassed) {
          this.isSubmitting = false;
          return;
        }
      }
      const launchModeInput = document.getElementById("js_launch_mode");
      const isDraft = launchModeInput && launchModeInput.value === "draft";
      if (!retryMode) {
        if (isDraft) {
          campaignModal.showLoadingModal("Saving your draft campaign...", "Please wait while we save your draft.");
        } else {
          campaignModal.showLoadingModal();
        }
      }
      const formData = new FormData(this.formElement);
      const url = this.formElement.action + ".json";
      const method = this.formElement.method?.toUpperCase() || "POST";
      try {
        const response = await fetch(url, {
          method,
          body: formData,
          headers: {
            "X-CSRF-Token": getCSRFToken(),
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          }
        });
        const data = await response.json();
        if (!response.ok) {
          console.error("Response not OK, status:", response.status);
          throw { response, data };
        }
        this.handleSuccessResponse(data);
      } catch (error) {
        console.error("Form submission error:", error);
        this.handleErrorResponse(error);
      }
    }
    // Handle successful form submission
    handleSuccessResponse(data) {
      this.isSubmitting = false;
      if (data.launch_mode === "draft" || data.launch_mode === "schedule_later") {
        if (data.launch_mode === "draft") {
          campaignModal.showSimpleSuccessModal("Draft Saved!", "Your draft campaign has been saved successfully.");
          setTimeout(() => {
            this.redirectToCampaign(data);
          }, 1500);
        } else {
          this.redirectToCampaign(data);
        }
      } else if (data.campaign_builder_id) {
        const context = this.buildContext(data);
        campaignPolling.startContextPolling(data.campaign_builder_id, context);
      } else {
        console.error("No campaign_builder_id in response:", data);
        campaignModal.showErrorModal("Could not retrieve campaign information");
      }
    }
    // Handle error response
    handleErrorResponse(error) {
      this.isSubmitting = false;
      const message = this.formatErrorMessage(error);
      campaignModal.showErrorModal(message, null, () => this.retry());
      this.resetSubmitButton();
    }
    // Format error message from response
    formatErrorMessage(error) {
      try {
        if (error.data) {
          if (error.data.errors) {
            if (Array.isArray(error.data.errors)) {
              return error.data.errors.join("<br>");
            } else if (typeof error.data.errors === "object") {
              return Object.values(error.data.errors).flat().join("<br>");
            }
          }
          return error.data.message || "An error occurred while launching your campaign";
        }
        return error.message || "An error occurred while launching your campaign";
      } catch (e) {
        return "An error occurred while launching your campaign";
      }
    }
    // Build context object from response data
    buildContext(data) {
      return {
        agencyId: data.agency_id,
        clientId: data.client_id,
        locationId: data.location_id,
        templateId: data.template_id,
        platform: data.platform
      };
    }
    // Redirect to campaign page
    redirectToCampaign(data) {
      let url;
      const isClientSession = isLauncherSessionPath();
      if (isClientSession) {
        url = `/launcher/campaign_builders/${data.campaign_builder_id}`;
      } else if (data.agency_id && data.location_id) {
        url = `/agencies/${data.agency_id}/${data.location_id}/${data.template_id}/campaign_builders/${data.campaign_builder_id}?platform=${data.platform}`;
      } else {
        url = `/clients/${data.client_id}/campaign_builders/${data.campaign_builder_id}`;
      }
      window.location.href = url;
    }
    // Retry form submission
    retry() {
      campaignModal.hideModal();
      campaignModal.showLoadingModal();
      this.submitForm(true);
    }
    // Reset submit button state
    resetSubmitButton() {
      if (!this.submitButton) return;
      const platform = this.getPlatform();
      if (platform === "google") {
        this.submitButton.value = "Campaign Launch";
      } else {
        this.submitButton.textContent = "Campaign Launch";
      }
      this.submitButton.disabled = false;
    }
    // Disable submit button
    disableSubmitButton() {
      if (!this.submitButton) return;
      const platform = this.getPlatform();
      if (platform === "google") {
        this.submitButton.value = "Launching...";
      } else {
        this.submitButton.textContent = "Launching...";
      }
      this.submitButton.disabled = true;
    }
  };
  var campaignFormHandler = window.campaignFormHandler || new CampaignFormHandler();
  window.campaignFormHandler = campaignFormHandler;
  window.retryFormSubmission = () => {
    campaignFormHandler.retry();
  };
  window.closeModalAndStopPolling = () => {
    campaignModal.hideModal();
    campaignPolling.stopPolling();
    campaignFormHandler.resetSubmitButton();
  };

  // app/javascript/shared/launch_button_handler.js
  init_esbuild_jquery_shim();

  // app/javascript/shared/i18n.js
  init_esbuild_jquery_shim();
  var currentLocale = "en";
  var translations = {};
  try {
    translations = require_translations();
  } catch (e) {
    console.warn("i18n: translations.json not found. Run 'rails i18n:js:export' to generate.");
  }
  var localeMeta = document.querySelector('meta[name="locale"]');
  if (localeMeta) {
    currentLocale = localeMeta.content || "en";
  }
  function t(key, options = {}) {
    const localeTranslations = translations[currentLocale] || translations.en || {};
    let value = dig(localeTranslations, key);
    if (value === void 0 && currentLocale !== "en") {
      const enTranslations = translations.en || {};
      value = dig(enTranslations, key);
    }
    if (value === void 0) {
      return key;
    }
    if (options && typeof value === "string") {
      Object.entries(options).forEach(([k, v]) => {
        value = value.replace(new RegExp(`%\\{${k}\\}`, "g"), v);
      });
    }
    return value;
  }
  function dig(obj, path) {
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
      if (current === null || current === void 0 || typeof current !== "object") {
        return void 0;
      }
      current = current[key];
    }
    return current;
  }

  // app/javascript/shared/launch_button_handler.js
  function initializeLaunchButtonHandler() {
    if (window._launchButtonHandlerInitialized) return;
    window._launchButtonHandlerInitialized = true;
    document.addEventListener("click", (e) => {
      const launchButton = e.target.closest(".js-launch-campaign");
      if (!launchButton) return;
      e.preventDefault();
      if (launchButton.dataset.inflight === "true") return;
      const formElement = document.getElementById("campaign_builder_form");
      if (!formElement) {
        showNotification("Form not found", "error");
        return;
      }
      const launchModeInput = document.getElementById("js_launch_mode");
      const launchMode = launchModeInput ? launchModeInput.value : "launch_now";
      const isDraft = launchMode === "draft";
      syncWizardFields(formElement);
      if (isDraft) {
        launchButton.dataset.inflight = "true";
        launchButton.disabled = true;
        launchButton.textContent = t("campaign_wizard.shared.saving");
        submitViaHandler(formElement, launchButton);
        return;
      }
      const isWizard = !!formElement.querySelector(
        '[data-controller~="google-wizard"], [data-controller~="campaign-wizard"]'
      );
      const isValid = isWizard || formElement.reportValidity();
      if (isValid) {
        launchButton.dataset.inflight = "true";
        launchButton.disabled = true;
        launchButton.textContent = t("campaign_wizard.shared.launching");
        submitViaHandler(formElement, launchButton);
      }
    });
  }
  function syncWizardFields(formElement) {
    const wizardEl = formElement.querySelector('[data-controller~="campaign-wizard"]');
    if (!wizardEl) return;
    const campaignType = wizardEl.dataset.campaignWizardCampaignTypeValue;
    const hiddenField = document.getElementById("remote_campaign_builder_job_campaign_type");
    if (hiddenField && campaignType) {
      hiddenField.value = campaignType;
    }
  }
  function submitViaHandler(formElement, launchButton) {
    if (campaignFormHandler && typeof campaignFormHandler.submitForm === "function") {
      campaignFormHandler.submitForm();
    } else {
      showNotification("Campaign form handler unavailable, using fallback submit", "warning");
      delete launchButton.dataset.inflight;
      launchButton.disabled = false;
      formElement.submit();
    }
  }

  // app/javascript/packs/campaign_builder_forms.js
  var initializeComponents = () => {
    campaignFormHandler.init();
    customVariablesHandler.init();
    if (document.getElementById("reach-estimate")) {
      audienceEstimator.init();
    }
    initializeCampaignTypeHandler();
    initializeBusinessNameCounter();
    initializeFormValidation();
    initializeFormFieldMonitoring();
    initializeLaunchButtonHandler();
    window.getHumanReadableStatus = (status) => campaignModal.getHumanReadableStatus(status);
    window.updateProgress = (percentage) => campaignModal.updateProgress(percentage);
    window.initialModal = () => campaignModal.showLoadingModal();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeComponents);
  } else {
    initializeComponents();
  }
  function initializeCampaignTypeHandler() {
    const campaignTypeSelect = document.getElementById("remote_campaign_builder_job_campaign_type");
    if (!campaignTypeSelect) return;
    campaignTypeSelect.addEventListener("change", function() {
      const campaignType = this.value;
      document.dispatchEvent(new CustomEvent("campaignTypeChanged", {
        detail: campaignType
      }));
      if (campaignType === "ezy-click-campaign") {
        handleLandingPagesCampaign();
      } else if (["messenger", "messenger_engagement"].includes(campaignType)) {
        handleMessengerCampaign();
      } else {
        handleDefaultCampaign();
      }
    });
    if (campaignTypeSelect) {
      campaignTypeSelect.dispatchEvent(new Event("change"));
    }
  }
  function handleLandingPagesCampaign() {
    const websiteUrlDiv = document.getElementById("website_url_div");
    const urlInput = document.getElementById("remote_campaign_builder_job_url");
    const pixelDiv = document.getElementById("pixel_div");
    const optionalPixelBox = document.getElementById("optional_pixel_box");
    if (websiteUrlDiv) websiteUrlDiv.classList.add("hidden");
    if (urlInput) {
      urlInput.disabled = true;
      urlInput.required = false;
      urlInput.classList.add("bg-gray-200", "cursor-not-allowed");
    }
    if (pixelDiv) pixelDiv.classList.remove("hidden");
    if (optionalPixelBox) optionalPixelBox.style.display = "none";
    const pixelSelect = document.getElementById("remote_campaign_builder_job_pixel_id");
    if (pixelSelect) pixelSelect.required = true;
    const easyPagesInput = document.getElementById("remote_campaign_builder_job_is_easy_pages_enabled");
    if (easyPagesInput) easyPagesInput.value = "true";
  }
  function handleMessengerCampaign() {
    const websiteUrlDiv = document.getElementById("website_url_div");
    const urlInput = document.getElementById("remote_campaign_builder_job_url");
    if (websiteUrlDiv) websiteUrlDiv.classList.add("hidden");
    if (urlInput) {
      urlInput.disabled = true;
      urlInput.required = false;
      urlInput.classList.add("bg-gray-200", "cursor-not-allowed");
    }
    removeDynamicFields();
  }
  function handleDefaultCampaign() {
    const websiteUrlDiv = document.getElementById("website_url_div");
    const urlInput = document.getElementById("remote_campaign_builder_job_url");
    const campaignType = document.getElementById("remote_campaign_builder_job_campaign_type").value;
    const isCallNow = campaignType == "call_now";
    const isLeadgenAd = campaignType == "leadgen_ad";
    if (websiteUrlDiv) {
      websiteUrlDiv.classList.toggle("hidden", isCallNow);
    }
    if (urlInput) {
      urlInput.disabled = isCallNow;
      urlInput.required = !isCallNow && !isLeadgenAd;
      urlInput.classList.toggle("bg-gray-200", isCallNow);
      urlInput.classList.toggle("cursor-not-allowed", isCallNow);
    }
    isCallNow ? "" : removeDynamicFields();
  }
  function removeDynamicFields() {
    document.querySelectorAll(".dynamic-fields").forEach((field) => {
      field.remove();
    });
  }
  function initializeBusinessNameCounter() {
    const businessNameField = document.getElementById("field_business_name");
    const counterLabel = document.getElementById("client_business_name");
    if (!businessNameField || !counterLabel) return;
    function updateCounter() {
      const remaining = 25 - businessNameField.value.length;
      const baseText = counterLabel.textContent.split("(")[0].trim();
      counterLabel.textContent = `${baseText} (${remaining} characters remaining)`;
    }
    businessNameField.addEventListener("input", updateCounter);
    updateCounter();
  }
  function initializeFormValidation() {
    const form = document.getElementById("campaign_builder_form");
    if (!form) return;
    form.addEventListener("submit", function(e) {
      const launchMode = document.getElementById("js_launch_mode");
      const isDraft = launchMode && launchMode.value === "draft";
      console.log("Form validation - isDraft:", isDraft, "launchMode:", launchMode?.value);
      if (isDraft) {
        console.log("Skipping validation for draft mode");
        return true;
      }
      if (!customVariablesHandler.validateRequiredFields()) {
        e.preventDefault();
        alert("Please fill in all required custom variable fields");
        return false;
      }
      const platform = document.querySelector('[name*="platform"]')?.value;
      if (platform === "facebook") {
        const hasLocations = document.querySelectorAll(".location-item").length > 0;
        if (!hasLocations) {
          e.preventDefault();
          alert("Please add at least one location");
          return false;
        }
      }
    });
  }
  function initializeFormFieldMonitoring() {
    const locationSearchElement = document.querySelector('[data-controller="location-search"]');
    if (!locationSearchElement) return;
    const fieldsToMonitor = [
      'input[name*="budget"]',
      'select[name*="campaign_type"]',
      'input[name*="end_date"]',
      'input[name*="url"]'
    ];
    fieldsToMonitor.forEach((selector) => {
      const field = document.querySelector(selector);
      if (field) {
        const eventType = field.tagName === "SELECT" ? "change" : "input";
        field.addEventListener(eventType, () => {
          const controller = window.Stimulus?.getControllerForElementAndIdentifier(
            locationSearchElement,
            "location-search"
          );
          if (controller && controller.updateSubmitButtonState) {
            controller.updateSubmitButtonState();
          }
        });
      }
    });
  }
})();
/*! Bundled license information:

jquery/dist/jquery.js:
  (*!
   * jQuery JavaScript Library v3.7.1
   * https://jquery.com/
   *
   * Copyright OpenJS Foundation and other contributors
   * Released under the MIT license
   * https://jquery.org/license
   *
   * Date: 2023-08-28T13:37Z
   *)
*/
;
