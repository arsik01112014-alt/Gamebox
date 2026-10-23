# GameBox

Сборник мини-игр: работает в браузере и в Android-приложении.

- Сайт: https://arsik01112014-alt.github.io/Gamebox/ (публикуется из `assets/` через GitHub Actions, `.github/workflows/pages.yml`)
- Веб-часть игры: `assets/` (`index.html`, `js/engine.js`, игры в `js/*.js`)
- Сборка APK: `build_apk.sh` (подпись v1 + v2, `tools/ApkV2Sign.java`; смена пакета — `tools/patch_manifest.py`)

Онлайн, рейтинг и вход через Google работают через Firebase (проект `gamebox-73da2`).
