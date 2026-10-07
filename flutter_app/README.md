# Application Android EMMANUEL

Cette application Flutter affiche le site [emmanuel-dpv.pages.dev](https://emmanuel-dpv.pages.dev).
Les liens vers d'autres sites, WhatsApp, les e-mails et les numéros de téléphone
s'ouvrent dans l'application correspondante sur le téléphone.

## Application publique

L'application publique utilise `lib/main.dart` et ouvre le site.

```sh
flutter build apk --flavor site -t lib/main.dart --release
```

## Application personnelle de gestion

Le deuxième APK utilise `lib/gestion.dart` et une copie embarquée de
`gestion-franc.html`. Les saisies et les aperçus restent sur l'appareil ; rien
n'est publié ni envoyé au site. Les boutons de consultation ouvrent le site
public dans le navigateur ou lisent `data2.json` en lecture seule.

Après toute modification de la page web `../gestion-franc.html`, recopiez-la
dans `assets/gestion-franc.html` avant de reconstruire l'APK.

```sh
flutter build apk --flavor gestion -t lib/gestion.dart --release
```

L'APK de gestion est généré dans
`build/app/outputs/flutter-apk/app-gestion-release.apk`.

## Lecteur personnel des messages

Le lecteur embarque `assets/lecteur-messages.html`, charge les messages depuis
`https://emmanuel-dpv.pages.dev/data2.json` et ouvre le site public avec un lien
externe. L'audio utilise un service média Android et ses commandes de
notification/écran verrouillé et Bluetooth. Android peut toujours interrompre
une lecture pour un appel, une perte de focus ou une action de l'utilisateur.

Après modification de `../lecteur-messages.html`, recopiez-le dans
`assets/lecteur-messages.html`, puis construisez l'APK :

```sh
flutter build apk --flavor lecteur -t lib/lecteur.dart --release
```

Le fichier est généré dans
`build/app/outputs/flutter-apk/app-lecteur-release.apk`.

## Tester l'application

Depuis ce dossier, avec Flutter et le SDK Android installés :

```sh
flutter pub get
flutter run --flavor site -t lib/main.dart
```

Pour lancer l'application de gestion :

```sh
flutter run --flavor gestion -t lib/gestion.dart
```

Les builds locaux utilisent la signature de débogage de Flutter. Une signature
de publication dédiée est nécessaire pour Google Play.
