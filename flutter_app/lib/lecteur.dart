import 'dart:async';
import 'dart:convert';

import 'package:audio_service/audio_service.dart';
import 'package:audio_session/audio_session.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'audio_handler.dart';

const _data2Uri = 'https://emmanuel-dpv.pages.dev/data2.json';
const _siteUri = 'https://emmanuel-dpv.pages.dev/';
late final EmmanuelAudioHandler audioHandler;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final audioSession = await AudioSession.instance;
  await audioSession.configure(const AudioSessionConfiguration.music());
  audioHandler = await AudioService.init(
    builder: EmmanuelAudioHandler.new,
    config: const AudioServiceConfig(
      androidNotificationChannelId: 'com.emmanuel.messages.audio',
      androidNotificationChannelName: 'Messages EMMANUEL',
      androidNotificationChannelDescription:
          'Lecture continue des messages EMMANUEL',
      androidNotificationOngoing: false,
      androidStopForegroundOnPause: false,
    ),
  );

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Color(0xFF10141D),
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF10141D),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const MessageReaderApp());
}

class MessageReaderApp extends StatelessWidget {
  const MessageReaderApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Messages EMMANUEL',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFE1BD51)),
        useMaterial3: true,
      ),
      home: const MessageReaderPage(),
    );
  }
}

class MessageReaderPage extends StatefulWidget {
  const MessageReaderPage({super.key});

  @override
  State<MessageReaderPage> createState() => _MessageReaderPageState();
}

class _MessageReaderPageState extends State<MessageReaderPage> {
  late final WebViewController _controller;
  bool _isLoading = true;
  int _progress = 0;
  bool _pageReady = false;
  bool _cloudDataRequested = false;

  @override
  void initState() {
    super.initState();
    audioHandler.onUpdate = _sendPlaybackState;
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF10141D))
      ..addJavaScriptChannel(
        'NativePlayer',
        onMessageReceived: (message) =>
            unawaited(_handlePlayerCommand(message.message)),
      )
      ..addJavaScriptChannel(
        'NativeDataReader',
        onMessageReceived: (_) {
          if (_pageReady) {
            unawaited(_loadCloudData());
          } else {
            _cloudDataRequested = true;
          }
        },
      )
      ..addJavaScriptChannel(
        'PublicSiteOpener',
        onMessageReceived: (_) => unawaited(_openSite()),
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            if (mounted) setState(() => _progress = progress);
          },
          onPageStarted: (_) {
            _pageReady = false;
            if (mounted) setState(() => _isLoading = true);
          },
          onPageFinished: (_) {
            _pageReady = true;
            if (mounted) {
              setState(() {
                _isLoading = false;
                _progress = 100;
              });
            }
            unawaited(_controller.runJavaScript(
              "document.body.classList.add('native-audio');",
            ));
            _sendPlaybackState(audioHandler.currentPageState);
            if (_cloudDataRequested) {
              _cloudDataRequested = false;
              unawaited(_loadCloudData());
            }
          },
          onWebResourceError: (error) {
            if ((error.isForMainFrame ?? true) && mounted) {
              setState(() => _isLoading = false);
              _showError('Impossible de charger le lecteur.');
            }
          },
          onNavigationRequest: _handleNavigationRequest,
        ),
      );
    unawaited(_controller.loadFlutterAsset('assets/lecteur-messages.html'));
  }

  Future<void> _handlePlayerCommand(String message) async {
    try {
      final command = jsonDecode(message);
      if (command is! Map<String, dynamic>) {
        throw const FormatException('Commande du lecteur invalide.');
      }
      switch (command['action']) {
        case 'play':
          final tracks = command['tracks'];
          if (tracks is! List) {
            throw const FormatException('Playlist invalide.');
          }
          await audioHandler.playTracks(tracks);
        case 'pause':
          await audioHandler.pause();
        case 'resume':
          await audioHandler.play();
        case 'toggle':
          if (audioHandler.playbackState.value.playing) {
            await audioHandler.pause();
          } else {
            await audioHandler.play();
          }
        case 'next':
          await audioHandler.skipToNext();
        case 'previous':
          await audioHandler.skipToPrevious();
        case 'stop':
          await audioHandler.stop();
        default:
          throw const FormatException('Action du lecteur inconnue.');
      }
    } on FormatException catch (error) {
      _showError(error.message);
    } on Exception catch (error) {
      _showError('Commande audio impossible : $error');
    }
  }

  Future<void> _loadCloudData() async {
    try {
      final response = await http.get(
        Uri.parse(_data2Uri),
        headers: const {'Cache-Control': 'no-cache'},
      ).timeout(const Duration(seconds: 30));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw http.ClientException(
          'Le serveur a répondu avec le code ${response.statusCode}.',
          Uri.parse(_data2Uri),
        );
      }
      final data = jsonDecode(response.body);
      if (data is! Map<String, dynamic> || data['messages'] is! List) {
        throw const FormatException('Le fichier data2.json est invalide.');
      }
      await _sendPageCall('window.receiveMessages', [response.body]);
    } on Exception catch (error) {
      await _sendPageCall('window.receiveMessages', ['', error.toString()]);
    }
  }

  Future<void> _sendPlaybackState(Map<String, Object?> state) async {
    await _sendPageCall('window.onNativePlayback', [state]);
  }

  Future<void> _sendPageCall(String function, List<Object?> arguments) async {
    if (!_pageReady) return;
    final encodedArguments = arguments.map(jsonEncode).join(',');
    try {
      await _controller.runJavaScript('$function($encodedArguments);');
    } on PlatformException {
      if (mounted) _showError('Impossible de communiquer avec le lecteur.');
    }
  }

  Future<NavigationDecision> _handleNavigationRequest(
    NavigationRequest request,
  ) async {
    final uri = Uri.tryParse(request.url);
    if (uri == null) return NavigationDecision.prevent;
    if (uri.scheme == 'file' ||
        uri.scheme == 'about' ||
        uri.scheme == 'javascript' ||
        uri.scheme == 'data' ||
        uri.scheme == 'blob') {
      return NavigationDecision.navigate;
    }
    if (uri.scheme == 'https' ||
        uri.scheme == 'http' ||
        uri.scheme == 'mailto' ||
        uri.scheme == 'tel' ||
        uri.scheme == 'sms') {
      await _openExternal(uri);
    }
    return NavigationDecision.prevent;
  }

  Future<void> _openSite() => _openExternal(Uri.parse(_siteUri));

  Future<void> _openExternal(Uri uri) async {
    try {
      final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!opened) _showError('Impossible d’ouvrir ce lien sur cet appareil.');
    } on PlatformException {
      _showError('Impossible d’ouvrir ce lien sur cet appareil.');
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  void dispose() {
    audioHandler.onUpdate = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF10141D),
      body: SafeArea(
        child: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_isLoading)
              Align(
                alignment: Alignment.topCenter,
                child: LinearProgressIndicator(
                  value: _progress == 0 ? null : _progress / 100,
                  color: const Color(0xFFE1BD51),
                  backgroundColor: const Color(0xFF202837),
                  minHeight: 3,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
