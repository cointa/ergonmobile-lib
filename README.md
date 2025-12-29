# Ergon Mobile Lib

Librerie JavaScript remote per l'applicazione mobile Ergon.

## Struttura Repository

Questa repository contiene le librerie JavaScript necessarie per il funzionamento dell'app mobile Ergon nelle sue varie versioni. Ogni versione è organizzata in una directory separata.

## Versioni Disponibili

### v2.0.0
**Tipo**: Flutter  
**Data rilascio**: Dicembre 2025  
**Piattaforme**: Android, iOS  
**Note**: Prima versione basata su Flutter con bridge postMessage

**INCOMPATIBILE con app Cordova** - Solo per app Flutter

**Contenuto**:
- `flutter/flutter-bridge.js` - Bridge postMessage universale
  - Sostituisce `cordova.js` e `cordova_plugins.js`
  - Emula API Cordova via postMessage
  - Comunicazione JavaScript - Flutter
- `flutter/js/`
  - `config.min.js` - Configurazione app (Identico a v1.4.5)
  - `lib/file.min.js` - Gestione file JSON (Con try-catch per errori)
  - `lib/fn.min.js` - Funzioni core app (Fix race condition + API aggiornata)
  - `lib/media.min.js` - Gestione media/immagini (Identico a v1.4.5)


**Novità v2.0.0**:
- Bridge postMessage per Flutter (sostituisce infrastruttura Cordova)
- Fix race condition in `getEntryPoint()`
- Gestione errori JSON parse con try-catch
- API HTTP aggiornata: `request()` invece di `sendRequest()`
- Device ID unificato: sempre `uuid` (non più `serial` con fallback)
- Logging estensivo per debugging
- Timeout su operazioni WiFi IP

---

### v1.4.5
**Tipo**: Cordova  
**Data rilascio**: Luglio 2024  
**Piattaforme**: Android, iOS  
**Note**: Versione stabile e testata per app Cordova

**Contenuto**:
- `cordova/android/platform_www/` 
  - `cordova.js` - Core Cordova per Android
  - `cordova_plugins.js` - Registro plugin
  - `plugins/` - Plugin Cordova nativi
- `cordova/ios/platform_www/`
  - `cordova.js` - Core Cordova per iOS
  - `cordova_plugins.js` - Registro plugin
  - `plugins/` - Plugin Cordova nativi
- `cordova/js/`
  - `config.min.js` - Configurazione app (445 bytes)
  - `lib/file.min.js` - Gestione file JSON (1.6 KB)
  - `lib/fn.min.js` - Funzioni core app (4.0 KB)
  - `lib/media.min.js` - Gestione media/immagini (1.7 KB)

---

### v1.4.2
**Tipo**: Cordova  
**Data rilascio**: n.d.  
**Piattaforme**: Android, iOS  
**Note**: Miglioramenti stabilità

**Contenuto**:
- `cordova/android/` - File Cordova per Android
- `cordova/ios/` - File Cordova per iOS
- `cordova/js/` - Librerie custom (config, file, fn, media)

---

### v1.3.2
**Tipo**: Cordova  
**Data rilascio**: n.d.  
**Piattaforme**: Android, iOS  
**Note**: Aggiornamenti minori e bugfix

**Contenuto**:
- `cordova/android/` - File Cordova per Android
- `cordova/ios/` - File Cordova per iOS
- `cordova/js/` - Librerie custom (config, file, fn, media)

---

### v1.2
**Tipo**: Cordova  
**Data rilascio**: n.d.  
**Piattaforme**: Android, iOS  
**Note**: Versione iniziale

**Contenuto**:
- `cordova/android/` - File Cordova per Android
- `cordova/ios/` - File Cordova per iOS
- `cordova/js/` - Librerie custom (config, file, fn, media)

---

## Differenze Principali tra Cordova e Flutter

| Caratteristica | Cordova (v1.x) | Flutter (v2.0.0) |
|----------------|----------------|------------------|
| **Architettura** | Cordova Native | Flutter + Bridge postMessage |
| **File Core** | cordova.js + cordova_plugins.js | flutter-bridge.js |
| **Plugin** | Nativi per piattaforma | Emulati via bridge |
| **Device ID** | `serial` con fallback a `uuid` | Sempre `uuid` |
| **HTTP API** | `sendRequest()` | `request()` |
| **Gestione Errori** | Base | Migliorata (try-catch) |
| **Debug** | Limitato | Logging estensivo |

---

## Compatibilità

### Versioni Supportate

- **v1.2** - Cordova (legacy)
- **v1.3.2** - Cordova (legacy)
- **v1.4.2** - Cordova (legacy)
- **v1.4.5** - Cordova (stabile)
- **v2.0.0** - Flutter (attiva)

### Retrocompatibilità

- Le versioni Cordova (v1.x) sono **compatibili tra loro**
- La versione Flutter (v2.x) è **incompatibile** con Cordova
- L'applicazione JSF gestisce automaticamente il routing

---

**Repository**: Ergon Mobile Lib  
**Maintainer**: Smeup BSA s.r.l. (sede di Monopoli)  
**Ultimo aggiornamento**: Dicembre 2025