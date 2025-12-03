// ignore_for_file: constant_identifier_names, prefer_typing_uninitialized_variables

enum ExceptionType {
  UNKNOWN,
  INVALID_DATA,
  NOT_RECEIVE_DATA,
  INSUFFICIENT_DATA_LENGTH,
  MISSING_TAIL_DATA,
  OX_ERR_DATA_NO_MATCH,
  OX_ERR_DATA_INCOMPLETE,
  BP_ERR_CODE_RESULT_INVALID,
  BP_ERR_CODE_LEAK_RETRY,
  BP_ERR_CODE_LEAK_GAS,
  BP_ERR_LEAK
}

class AppException {
  var message;

  ExceptionType type;

  AppException({required this.message, required this.type});
}
