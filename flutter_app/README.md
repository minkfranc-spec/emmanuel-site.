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
GitHub (`minkfranc-spec/emmanuel-site./main/data2.json`) et ouvre le site public
avec un lien externe. Le service média Android permet de déplacer la position
depuis la barre de lecture de la notification et de passer au message précédent
ou suivant. Les commandes sont aussi disponibles sur l'écran verrouillé et les
accessoires Bluetooth. Android peut toujours interrompre une lecture pour un
appel, une perte de focus ou une action de l'utilisateur.

Après modification de `../lecteur-messages.html`, recopiez-le dans
`assets/lecteur-messages.html`, puis construisez l'APK :

```sh
flutter build apk --flavor lecteur -t lib/lecteur.dart --release
```

Le fichier est généré dans
`build/app/outputs/flutter-apk/app-lecteur-release.apk`.
Les favoris du lecteur APK sont enregistrés localement sur l'appareil et ne sont
pas remplacés par `favoris.json` du site. Ils restent présents après une mise à
jour installée par-dessus l'application, tant que l'identifiant de l'application
et sa signature restent les mêmes. Désinstaller l'application ou effacer ses
données supprime aussi les favoris locaux.

Pour vérifier leur conservation, ajoute un favori dans la version installée,
installe le nouvel APK directement par-dessus sans désinstaller l'application,
puis vérifie que le favori est toujours présent.

Après compilation et installation sur Android, vérifie également les commandes
audio suivantes :

- déplacer la barre de progression dans la notification ;
- passer au message précédent et au suivant depuis la notification ;
- cliquer une fois sur « Lire ce message » pour le répéter, puis une deuxième
  fois pour reprendre la lecture continue avec les messages suivants.

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
