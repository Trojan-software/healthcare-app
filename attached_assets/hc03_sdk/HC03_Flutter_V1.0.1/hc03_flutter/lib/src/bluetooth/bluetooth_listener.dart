abstract class Listener<T> {
  void addListener(T listener);
  void removeListener(T listener);
  void notifity();
}

class ScanListener<T> extends Listener<T> {
  List listeners = [];
  @override
  void addListener(T listener) {
    if (!listeners.contains(listener)) {
      listeners.add(listener);
    }
  }

  @override
  void removeListener(T listener) {
    if (listeners.contains(listener)) {
      listeners.remove(listener);
    }
  }

  @override
  void notifity({isScanning}) {
    for (var listener in listeners) {
      listener(isScanning);
    }
  }
}

class ConnectListener<T> extends Listener<T> {
  List listeners = [];
  @override
  void addListener(T listener) {
    if (!listeners.contains(listener)) {
      listeners.add(listener);
    }
  }

  @override
  void removeListener(T listener) {
    if (listeners.contains(listener)) {
      listeners.remove(listener);
    }
  }

  @override
  void notifity({device,isConnect}) {
    for (var listener in listeners) {
      listener(device,isConnect);
    }
  }
}