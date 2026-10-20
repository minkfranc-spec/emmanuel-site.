import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';

class EmmanuelAudioHandler extends BaseAudioHandler
    with QueueHandler, SeekHandler {
  EmmanuelAudioHandler() {
    // Écoute les événements de lecture pour mettre à jour la notification
    _player.playbackEventStream.listen(
      _broadcastState,
      onError: (Object error, StackTrace stackTrace) {
        onUpdate?.call({
          'playing': false,
          'status': 'Erreur audio : $error',
        });
      },
    );

    // Quand la piste change → met à jour mediaItem + notifie la page
    _player.currentIndexStream.listen((index) {
      final items = queue.value;
      final item = index != null && index >= 0 && index < items.length
          ? items[index]
          : null;
      if (_loopMessageId != null &&
          item != null &&
          item.extras?['messageId'] != _loopMessageId) {
        unawaited(_player.seek(Duration.zero, index: _loopStartIndex));
        return;
      }
      mediaItem.add(item == null ? null : _withCurrentDuration(item));
      _notifyPage();
    });

    _player.durationStream.listen((duration) {
      if (duration == null) return;
      final item = mediaItem.value;
      if (item == null || item.duration == duration) return;
      mediaItem.add(item.copyWith(duration: duration));
    });

    // Quand l'état du lecteur change → notifie la page
    _player.playerStateStream.listen((state) {
      _broadcastState(_player.playbackEvent);
      _notifyPage();

      // Quand la lecture se termine naturellement → notifie "ended"
      if (state.processingState == ProcessingState.completed &&
          _loopMessageId != null) {
        unawaited(_restartLoopedMessage());
      } else if (state.processingState == ProcessingState.completed) {
        onUpdate?.call({...currentPageState, 'ended': true});
      }
    });

    // Timer de synchro position — envoie la position toutes les secondes
    // pendant la lecture pour garder la barre de progression synchronisée
    _positionTimer = Timer.periodic(const Duration(milliseconds: 500), (_) {
      if (_player.playing) _notifyPage();
    });
  }

  void _setCurrentMediaItem(int index) {
    final items = queue.value;
    if (index >= 0 && index < items.length) {
      mediaItem.add(_withCurrentDuration(items[index]));
    }
  }

  Future<void> _restartLoopedMessage() async {
    final loopMessageId = _loopMessageId;
    if (loopMessageId == null) return;
    await _player.seek(Duration.zero, index: _loopStartIndex);
    if (_loopMessageId == loopMessageId) await _player.play();
  }

  final AudioPlayer _player = AudioPlayer();
  late final Timer _positionTimer;
  ConcatenatingAudioSource? _audioSource;
  String? _loopMessageId;
  int _loopStartIndex = 0;
  ValueChanged<Map<String, Object?>>? onUpdate;

  Map<String, Object?> get currentPageState => _pageState;

  Map<String, Object?> get _pageState {
    final index = _player.currentIndex;
    final items = queue.value;
    final item = index != null && index >= 0 && index < items.length
        ? items[index]
        : null;
    final processingState = _player.processingState;
    return {
      'playing': _player.playing,
      'positionMs': _player.position.inMilliseconds,
      'durationMs': _player.duration?.inMilliseconds ?? 0,
      'looping': _loopMessageId != null,
      if (item != null)
        'track': {
          'id': item.extras?['messageId'] ?? '',
          'title': item.title,
          'part': item.extras?['part'] ?? 1,
          'date': item.extras?['date'] ?? '',
        },
      if (processingState == ProcessingState.completed)
        'status': 'Lecture terminée.',
      if (processingState == ProcessingState.completed) 'ended': true,
    };
  }

  Future<void> playTracks(
    List<dynamic> tracks, {
    bool loop = false,
    String? startMessageId,
  }) async {
    final items = _mediaItemsFor(tracks);
    if (items.isEmpty) {
      onUpdate?.call({
        'playing': false,
        'status': 'Aucun message avec une piste audio disponible.',
      });
      return;
    }

    final startIndex = startMessageId == null
        ? 0
        : items.indexWhere(
            (item) => item.extras?['messageId'] == startMessageId,
          );
    final resolvedStartIndex = startIndex < 0 ? 0 : startIndex;
    _loopMessageId = null;
    await _player.stop();
    queue.add(items);
    final source = ConcatenatingAudioSource(
      useLazyPreparation: true,
      children: _audioSourcesFor(items),
    );
    _audioSource = source;
    _loopStartIndex = resolvedStartIndex;
    final initialMessageId =
        items[resolvedStartIndex].extras?['messageId'];
    _loopMessageId =
        loop && initialMessageId is String ? initialMessageId : null;
    await _player.setAudioSource(source, initialIndex: resolvedStartIndex);
    _setCurrentMediaItem(resolvedStartIndex);
    _broadcastState(_player.playbackEvent);
    await _player.setLoopMode(LoopMode.off);
    await _player.setShuffleModeEnabled(false);
    await play();
  }

  Future<void> continueTracks() async {
    if (_audioSource == null) return;
    _loopMessageId = null;
    await _player.setLoopMode(LoopMode.off);
    _notifyPage();
  }

  List<MediaItem> _mediaItemsFor(List<dynamic> tracks) {
    final items = <MediaItem>[];
    for (final value in tracks) {
      if (value is! Map) continue;
      final source = value['source'];
      final id = value['id'];
      if (source is! String || id is! String) continue;
      final uri = Uri.tryParse(source);
      if (uri == null || uri.scheme != 'https') continue;
      items.add(
        MediaItem(
          id: source,
          title:
              value['title'] is String ? value['title'] as String : 'Message',
          artist: 'EMMANUEL · ID $id',
          album: 'Messages EMMANUEL',
          extras: {
            'messageId': id,
            'part': value['part'] == 2 ? 2 : 1,
            'date': value['date'] is String ? value['date'] as String : '',
          },
        ),
      );
    }
    return items;
  }

  List<AudioSource> _audioSourcesFor(List<MediaItem> items) => items
      .map((item) => AudioSource.uri(Uri.parse(item.id), tag: item))
      .toList();

  @override
  Future<void> play() async {
    await _player.play();
    // Réactive la notification si elle était bloquée sur "arrêté"
    _broadcastState(_player.playbackEvent);
  }

  @override
  Future<void> pause() => _player.pause();

  @override
  Future<void> seek(Duration position) => _player.seek(position);

  @override
  Future<void> skipToNext() async {
    await _skipMessage(1);
  }

  @override
  Future<void> skipToPrevious() async {
    await _skipMessage(-1);
  }

  Future<void> _skipMessage(int direction) async {
    final currentIndex = _player.currentIndex;
    final items = queue.value;
    if (currentIndex == null ||
        currentIndex < 0 ||
        currentIndex >= items.length) {
      return;
    }

    final currentMessageId = items[currentIndex].extras?['messageId'];
    var targetIndex = currentIndex + direction;

    while (targetIndex >= 0 &&
        targetIndex < items.length &&
        items[targetIndex].extras?['messageId'] == currentMessageId) {
      targetIndex += direction;
    }

    if (direction < 0 && targetIndex >= 0) {
      final targetMessageId = items[targetIndex].extras?['messageId'];
      while (targetIndex > 0 &&
          items[targetIndex - 1].extras?['messageId'] == targetMessageId) {
        targetIndex--;
      }
    } else if (direction < 0) {
      targetIndex = currentIndex;
      while (targetIndex > 0 &&
          items[targetIndex - 1].extras?['messageId'] == currentMessageId) {
        targetIndex--;
      }
    }

    if (targetIndex >= 0 && targetIndex < items.length) {
      _loopMessageId = null;
      await _player.seek(Duration.zero, index: targetIndex);
    } else if (direction < 0 && items.isNotEmpty) {
      _loopMessageId = null;
      await _player.seek(Duration.zero, index: 0);
    }
  }

  @override
  Future<void> stop() async {
    await _player.stop();
    queue.add(const []);
    _audioSource = null;
    _loopMessageId = null;
    mediaItem.add(null);
    await super.stop();
    // Notifie la page que la lecture est arrêtée
    onUpdate?.call({'playing': false, 'status': 'Lecture arrêtée.', 'ended': true});
  }

  // Action personnalisée pour le bouton boucle dans la notification
  static const _loopAction = 'toggle_loop';

  @override
  Future<void> onCustomAction(String name, dynamic extras) async {
    if (name == _loopAction) {
      await toggleLoop();
    }
  }

  /// Bascule la boucle sur le message en cours.
  /// Appelé depuis la notification OU depuis la page via l'action 'loop'.
  Future<void> toggleLoop() async {
    final index = _player.currentIndex;
    final items = queue.value;
    if (index == null || index < 0 || index >= items.length) return;

    if (_loopMessageId != null) {
      // Désactive la boucle → lecture continue
      _loopMessageId = null;
    } else {
      // Active la boucle sur le message en cours
      final currentMessageId = items[index].extras?['messageId'];
      if (currentMessageId is! String) return;
      _loopMessageId = currentMessageId;
      // Trouve le premier index de ce message dans la queue
      _loopStartIndex = items.indexWhere(
        (item) => item.extras?['messageId'] == currentMessageId,
      );
      if (_loopStartIndex < 0) _loopStartIndex = index;
    }

    _broadcastState(_player.playbackEvent);
    _notifyPage();
  }

  void _broadcastState(PlaybackEvent event) {
    const processingStates = {
      ProcessingState.idle: AudioProcessingState.idle,
      ProcessingState.loading: AudioProcessingState.loading,
      ProcessingState.buffering: AudioProcessingState.buffering,
      ProcessingState.ready: AudioProcessingState.ready,
      ProcessingState.completed: AudioProcessingState.completed,
    };
    final playing = _player.playing;
    final looping = _loopMessageId != null;
    final index = event.currentIndex;

    // Bouton boucle personnalisé — icône change selon l'état actif/inactif
    final loopControl = MediaControl.custom(
      androidIcon: looping
          ? 'drawable/ic_loop_on'
          : 'drawable/ic_loop_off',
      label: looping ? 'Désactiver boucle' : 'Activer boucle',
      name: _loopAction,
    );

    // Boutons de la notification :
    // [⏮ Précédent] [⏸/▶ Pause/Play] [⏭ Suivant] [🔁 Boucle]
    // androidCompactActionIndices = indices affichés en vue réduite (3 max)
    playbackState.add(
      PlaybackState(
        controls: [
          MediaControl.skipToPrevious,
          playing ? MediaControl.pause : MediaControl.play,
          MediaControl.skipToNext,
          loopControl,
        ],
        systemActions: const {
          MediaAction.seek,
          MediaAction.seekForward,
          MediaAction.seekBackward,
        },
        androidCompactActionIndices: const [0, 1, 2],
        processingState: processingStates[_player.processingState]!,
        playing: playing,
        updatePosition: _player.position,
        bufferedPosition: _player.bufferedPosition,
        speed: _player.speed,
        queueIndex: index,
        updateTime: DateTime.now(),
      ),
    );
  }

  MediaItem _withCurrentDuration(MediaItem item) {
    final duration = _player.duration;
    return duration == null ? item : item.copyWith(duration: duration);
  }

  void _notifyPage() {
    onUpdate?.call(_pageState);
  }

  // Libère les ressources proprement
  Future<void> dispose() async {
    _positionTimer.cancel();
    await _player.dispose();
  }
}
