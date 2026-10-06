# EMMANUEL

Site statique du ministère EMMANUEL et applications Android Flutter dans
[`flutter_app/`](./flutter_app/).

Pour générer l'APK personnel de gestion, installez Flutter et le SDK Android,
puis exécutez :

```sh
cd flutter_app
flutter build apk --flavor gestion -t lib/gestion.dart --release
```

L'APK est créé dans
`flutter_app/build/app/outputs/flutter-apk/app-gestion-release.apk`.

Cette application travaille sur une copie locale isolée de `gestion-franc.html`.
Elle permet de consulter le site public et de lire `data2.json` sans publier de
modification.

Après une modification de la page web, recopiez `gestion-franc.html` dans
`flutter_app/assets/gestion-franc.html` avant de reconstruire l'APK.