/**
 * UNIVERSAL BRIDGE - postMessage Based
 * Version: 1.0.0
 * Encoding: UTF-8
 */

(function(window) {
  'use strict';

  // Config
  var BRIDGE_CONFIG = {
    debug: true,
    timeout: 5000,
    maxRetries: 3
  };

  var requestIdCounter = 0;
  var pendingRequests = new Map();

  function generateRequestId() {
    return 'req_' + Date.now() + '_' + (++requestIdCounter);
  }

  function log(message, level) {
    if (!BRIDGE_CONFIG.debug && level !== 'error') return;

    var prefix = {
      'info': '[INFO]',
      'warn': '[WARN]',
      'error': '[ERROR]',
      'success': '[OK]'
    }[level || 'info'] || '[LOG]';

    console.log(prefix + ' [BRIDGE] ' + message);
  }

  function sendCommand(command, data, options) {
    data = data || {};
    options = options || {};
    return new Promise(function(resolve, reject) {
      var requestId = generateRequestId();
      log('Invio comando: ' + command + ' [' + requestId + ']');

      var effectiveTimeout = options.timeout === 0 ? 0 : (options.timeout || BRIDGE_CONFIG.timeout);
      var timeoutId = null;

      if (effectiveTimeout > 0) {
        timeoutId = setTimeout(function() {
          pendingRequests.delete(requestId);
          reject(new Error('Timeout: ' + command + ' non ha risposto entro ' + effectiveTimeout + 'ms'));
        }, effectiveTimeout);
      }

      pendingRequests.set(requestId, {
        resolve: resolve,
        reject: reject,
        timeoutId: timeoutId,
        command: command,
        timestamp: Date.now()
      });

      var message = {
        type: 'BRIDGE_REQUEST',
        id: requestId,
        command: command,
        data: data,
        timestamp: Date.now()
      };

      window.postMessage(message, '*');
    });
  }

  window.addEventListener('message', function(event) {
    var message = event.data;
    if (!message || message.type !== 'BRIDGE_RESPONSE') return;

    log('Ricevuta risposta per: ' + message.id);

    var pending = pendingRequests.get(message.id);
    if (!pending) {
      log('Nessuna richiesta in attesa per ID: ' + message.id, 'warn');
      return;
    }

    clearTimeout(pending.timeoutId);
    pendingRequests.delete(message.id);

    if (message.error) {
      log('Errore: ' + message.error, 'error');
      pending.reject(new Error(message.error));
    } else {
      log('Successo: ' + pending.command, 'success');
      pending.resolve(message.data);
    }
  });

  // Device API
  if (!window.device) window.device = {};

  // Cordova API
  window.cordova = window.cordova || {};
  window.cordova.file = { dataDirectory: 'cdvfile://localhost/persistent/' };
  window.cordova.plugin = window.cordova.plugin || {};

  // HTTP Plugin
  window.cordova.plugin.http = {
    _globalHeaders: {},
    setHeader: function(key, value) {
      log('HTTP Header: ' + key + ' = ' + value);
      this._globalHeaders[key] = value;
    },
    setCookie: function(url, cookie, options) {
      log('HTTP setCookie: ' + url);
      sendCommand('httpSetCookie', { url: url, cookie: cookie, options: options });
    },
    request: function(url, options, success, failure) {
      log('HTTP Request: ' + url);
      var requestData = {
        url: url,
        method: options.method || 'GET',
        data: options.data || {},
        headers: Object.assign({}, this._globalHeaders, options.headers || {})
      };
      sendCommand('httpRequest', requestData)
        .then(function(response) {
          (response.status >= 200 && response.status < 300) ? success(response) : failure(response);
        })
        .catch(function(error) {
          var errorData = {
            status: -1,
            error: error.message,
            headers: requestData.headers,
            url: requestData.url
          };
          failure(errorData);
        });
    },
    get: function(url, params, headers, success, failure) {
      this.request(url, { method: 'GET', data: params, headers: headers }, success, failure);
    },
    post: function(url, data, headers, success, failure) {
      this.request(url, { method: 'POST', data: data, headers: headers }, success, failure);
    }
  };

  // InAppBrowser
  window.cordova.InAppBrowser = {
    open: function(url, target, options) {
      log('InAppBrowser.open: ' + url);
      sendCommand('inAppBrowserOpen', { url: url, target: target || '_system', options: options || '' });
    }
  };

  // Exit App
  window.cordova.plugins = window.cordova.plugins || {};
  window.cordova.plugins.exit = function() { return sendCommand('exitApp'); };
  window.navigator.app = window.navigator.app || {};
  window.navigator.app.exitApp = function() { return sendCommand('exitApp'); };

  // Keyboard
  window.cordova.plugins.Keyboard = {
    show: function() {
      log('Keyboard.show');
      return sendCommand('keyboardShow');
    },
    hide: function() {
      log('Keyboard.hide');
      return sendCommand('keyboardHide');
    },
    // Altri metodi possono essere aggiunti qui se necessario
    onshow: function() {},
    onhide: function() {}
  };

  // QR Scanner
  window.QRScanner = {
    prepare: function(callback) {
      log('QRScanner prepare');
      callback(null, { authorized: true });
    },
    scan: function(callback) {
      log('QRScanner scan');
      sendCommand('qrScannerRequest', {}, { timeout: 0 })
        .then(function(response) { callback(null, response.result || ''); })
        .catch(function(error) { callback(error); });
    },
    show: function(callback) {
      log('QRScanner show');
      callback && callback({ showing: true });
    },
    hide: function(callback) {
      log('QRScanner hide');
      callback && callback({ hidden: true });
    },
    destroy: function(callback) {
      log('QRScanner destroy');
      callback && callback({ destroyed: true });
    },
    enableLight: function(callback) {
      log('QRScanner enableLight');
      callback && callback(null, { enabled: true });
    },
    disableLight: function(callback) {
      log('QRScanner disableLight');
      callback && callback(null, { disabled: true });
    }
  };

  // FCM
  window.FCM = {
    onNotification: function(callback) {
      log('FCM onNotification registrato');
      window._fcmNotificationCallback = callback;
    },
    subscribeToTopic: function(topic) {
      return sendCommand('fcmSubscribe', { topic: topic });
    },
    unsubscribeFromTopic: function(topic) {
      return sendCommand('fcmUnsubscribe', { topic: topic });
    },
    requestPermission: function() {
      return sendCommand('fcmRequestPermission');
    },
    requestPushPermission: function() {
      return this.requestPermission();
    },
    getToken: function() {
      return sendCommand('fcmGetToken');
    }
  };

  // App Version
  window.getAppVersion = function() {
    return sendCommand('getAppVersion').then(function(result) {
      // Ritorna solo la stringa della versione, non l'oggetto
      return result.version || result;
    });
  };

  // Cache Clear
  window.CacheClear = function(success, failure) {
    log('CacheClear chiamato');
    if ('caches' in window) {
      caches.keys()
        .then(function(names) {
          return Promise.all(names.map(function(name) {
            return caches.delete(name);
          }));
        })
        .then(function() {
          log('Cache pulita con successo', 'success');
          success && success();
        })
        .catch(function(error) {
          log('Errore pulizia cache: ' + error, 'error');
          failure && failure(error);
        });
    } else {
      log('Caches API non disponibile', 'warn');
      success && success();
    }
  };
  window.navigator.app.clearCache = window.CacheClear;

  // File System API
  window.LocalFileSystem = { PERSISTENT: 1, TEMPORARY: 0 };

  function createFileEntry(path, filesystem) {
    var cleanPath = '/' + path.replace(/^\/+/, '');

    return {
      isFile: true,
      isDirectory: false,
      name: path.split('/').filter(Boolean).pop() || 'file',
      fullPath: cleanPath,
      filesystem: filesystem,

      file: function(successCallback, errorCallback) {
        log('FileEntry.file: ' + this.fullPath);
        sendCommand('fileRead', { path: cleanPath })
          .then(function(result) {
            // Controlla se c'è un errore nel result
            if (result.error) {
              log('Errore lettura file: ' + result.error, 'error');
              errorCallback && errorCallback({ code: result.code || 1, message: result.error });
              return;
            }

            var blob = new Blob([result.data], { type: 'application/json' });
            var file = new File([blob], this.name, { type: 'application/json' });
            file.fullPath = this.fullPath;
            successCallback && successCallback(file);
          }.bind(this))
          .catch(function(error) {
            log('Errore lettura file: ' + error, 'error');
            errorCallback && errorCallback({ code: 1, message: error.message });
          });
      },

      createWriter: function(successCallback, errorCallback) {
        log('FileEntry.createWriter: ' + this.fullPath);
        var filePath = cleanPath;

        var writer = {
          position: 0,
          length: 0,
          readyState: 0,
          error: null,
          onwritestart: null,
          onprogress: null,
          onwrite: null,
          onabort: null,
          onerror: null,
          onwriteend: null,

          write: function(blob) {
            var reader = new FileReader();
            reader.onloadend = function() {
              sendCommand('fileWrite', { path: filePath, data: reader.result })
                .then(function(result) {
                  if (result.error) {
                    log('Errore scrittura: ' + result.error, 'error');
                    writer.onerror && writer.onerror({ message: result.error });
                  } else {
                    log('File scritto: ' + filePath + ' (' + result.size + ' bytes)', 'success');
                    writer.onwriteend && writer.onwriteend();
                  }
                })
                .catch(function(error) {
                  log('Errore scrittura: ' + error, 'error');
                  writer.onerror && writer.onerror(error);
                });
            };
            reader.onerror = function(error) {
              log('Errore lettura blob: ' + error, 'error');
              writer.onerror && writer.onerror(error);
            };
            reader.readAsText(blob);
          },

          seek: function(offset) {
            this.position = offset;
          },
          truncate: function(size) {
            log('FileWriter.truncate: ' + size);
          },
          abort: function() {
            log('FileWriter.abort');
          }
        };

        successCallback && successCallback(writer);
      },

      remove: function(successCallback, errorCallback) {
        log('FileEntry.remove: ' + this.fullPath);
        sendCommand('fileDelete', { path: cleanPath })
          .then(function() {
            successCallback && successCallback();
          })
          .catch(function(error) {
            errorCallback && errorCallback({ message: error.message });
          });
      }
    };
  }

  function createDirectoryEntry(path, filesystem) {
    var cleanPath = '/' + path.replace(/^\/+/, '').replace(/\/+$/, '');

    return {
      isFile: false,
      isDirectory: true,
      name: path.split('/').filter(Boolean).pop() || 'root',
      fullPath: cleanPath || '/',
      filesystem: filesystem,

      getFile: function(filename, options, successCallback, errorCallback) {
        log('DirectoryEntry.getFile: ' + filename);
        var filePath = (this.fullPath === '/' ? '/' : this.fullPath + '/') + filename;
        var fileEntry = createFileEntry(filePath, this.filesystem);

        if (options && options.create) {
          // NON scrivere nulla, il file verrà creato quando serve
          // Ritorna subito il fileEntry
          successCallback && successCallback(fileEntry);
        } else {
          sendCommand('fileExists', { path: filePath })
            .then(function(result) {
              if (result.exists) {
                successCallback && successCallback(fileEntry);
              } else {
                errorCallback && errorCallback({ code: 1, message: 'NOT_FOUND_ERR' });
              }
            })
            .catch(function(error) {
              errorCallback && errorCallback({ code: 1, message: error.message });
            });
        }
      },

      getDirectory: function(dirname, options, successCallback, errorCallback) {
        log('DirectoryEntry.getDirectory: ' + dirname);
        var dirPath = (this.fullPath === '/' ? '/' : this.fullPath + '/') + dirname;
        var dirEntry = createDirectoryEntry(dirPath, this.filesystem);
        successCallback && successCallback(dirEntry);
      },

      createReader: function() {
        log('DirectoryEntry.createReader');
        return {
          readEntries: function(successCallback, errorCallback) {
            successCallback && successCallback([]);
          }
        };
      },

      removeRecursively: function(successCallback, errorCallback) {
        log('DirectoryEntry.removeRecursively: ' + this.fullPath);
        sendCommand('directoryRemove', { path: this.fullPath })
          .then(function() {
            successCallback && successCallback();
          })
          .catch(function(error) {
            errorCallback && errorCallback({ message: error.message });
          });
      }
    };
  }

  var FileSystemMock = {
    name: 'persistent',
    root: null
  };
  FileSystemMock.root = createDirectoryEntry('', FileSystemMock);

  window.resolveLocalFileSystemURL = function(url, successCallback, errorCallback) {
    log('resolveLocalFileSystemURL: ' + url);
    var path = url
      .replace('cdvfile://localhost/persistent/', '')
      .replace('file:///', '')
      .replace(/^data\/data\//, '')
      .replace(/^\/+/, '');
    var isDirectory = url.endsWith('/') || path === '' || !path.includes('.');

    if (isDirectory) {
      // Per le directory, ritorna subito il DirectoryEntry
      successCallback && successCallback(createDirectoryEntry(path, FileSystemMock));
    } else {
      // CORREZIONE: Per i file, controlla prima se esistono
      sendCommand('fileExists', { path: path })
        .then(function(result) {
          if (result.exists) {
            // Il file esiste, ritorna il FileEntry
            successCallback && successCallback(createFileEntry(path, FileSystemMock));
          } else {
            // Il file NON esiste, chiama errorCallback
            log('File non trovato: ' + path, 'error');
            errorCallback && errorCallback({ code: 1, message: 'File non trovato' });
          }
        })
        .catch(function(error) {
          log('Errore verifica file: ' + error, 'error');
          errorCallback && errorCallback({ code: 1, message: error.message });
        });
    }
  };

  window.requestFileSystem = function(type, size, successCallback, errorCallback) {
    log('requestFileSystem: type=' + type + ', size=' + size);
    successCallback && successCallback(FileSystemMock);
  };

  // ====================================================================
  // FIX: Cordova-like deviceready behavior
  // Cordova chiamava i listener anche se deviceready era già stato dispatched
  // ====================================================================
  var deviceReadyFired = false;
  var deviceReadyCallbacks = [];

  // Override di addEventListener per intercettare deviceready
  var originalAddEventListener = document.addEventListener;
  document.addEventListener = function(type, listener, options) {
    if (type === 'deviceready') {
      log('Listener deviceready registrato' + (deviceReadyFired ? ' (deviceready già fired, calling immediately)' : ''));
      
      if (deviceReadyFired) {
        // deviceready già dispatched, chiama il listener immediatamente
        setTimeout(function() {
          log('Chiamata immediata listener deviceready (già fired)');
          listener.call(document, new Event('deviceready'));
        }, 0);
      } else {
        // deviceready non ancora dispatched, registra normalmente
        deviceReadyCallbacks.push(listener);
        originalAddEventListener.call(document, type, listener, options);
      }
    } else {
      // Altri eventi, comportamento normale
      originalAddEventListener.call(document, type, listener, options);
    }
  };

  // Funzione helper per dispatch deviceready
  function dispatchDeviceReady() {
    if (!deviceReadyFired) {
      deviceReadyFired = true;
      log('Dispatching deviceready (prima volta)', 'success');
      document.dispatchEvent(new Event('deviceready'));
      log('Event deviceready dispatched', 'success');
    }
  }

  // Initialization
  function initialize() {
    log('Bridge inizializzato e in attesa di platformReady');

    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'PLATFORM_READY') {
        log('Piattaforma pronta! Caricamento device info...', 'success');

        Promise.all([
          sendCommand('getDevicePlatform'),
          sendCommand('getDeviceUuid'),
          sendCommand('getDeviceSerial')
        ])
        .then(function(results) {
          var platform = results[0];
          var uuid = results[1];
          var serial = results[2];

          window.device.platform = platform.platform || platform;
          window.device.uuid = uuid.uuid || uuid;
          window.device.serial = serial.serial || serial;
          window.device.cordova = '12.0.0-postmessage-bridge';
          window.device.model = 'Unknown';
          window.device.version = 'unknown';
          window.device.manufacturer = 'Unknown';
          window.device.isVirtual = false;

          log('Device info caricato: ' + JSON.stringify(window.device), 'success');

          dispatchDeviceReady();
        })
        .catch(function(error) {
          log('Errore caricamento device info: ' + error, 'error');
          window.device.platform = 'Android';
          window.device.uuid = 'unknown';
          window.device.serial = 'unknown';
          dispatchDeviceReady();
        });
      }
    });

    window.postMessage({ type: 'BRIDGE_READY' }, '*');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  window.__bridge = {
    sendCommand: sendCommand,
    pendingRequests: pendingRequests,
    config: BRIDGE_CONFIG
  };

  log('Bridge postMessage caricato e pronto!', 'success');

})(window);