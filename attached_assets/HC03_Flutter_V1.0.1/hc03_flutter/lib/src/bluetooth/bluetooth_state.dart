enum BlueState {
  connected,
  disConnect,
  scanning,
  stopScan,
  unknown
}

class BlueToothState {
  BlueState currentState=BlueState.unknown;

  BlueState get getCurrentState {
    return currentState;
  }

  void setCurrentState(BlueState state) {
    currentState = state;
  }
}
