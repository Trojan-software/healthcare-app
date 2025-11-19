import 'dart:math';

import 'package:flutter/material.dart';
import 'package:get/get.dart';

class HrWave extends StatefulWidget {
  List<int> waveData;

  var update;

  var paintColor;

  HrWave({Key? key, required this.waveData, this.update, this.paintColor})
      : super(key: key);

  @override
  _HrWaveState createState() => _HrWaveState();
}

class _HrWaveState extends State<HrWave> {
  var offsetX = 0.0.obs;
  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() => Row(
          children: [
            CustomPaint(
              painter: LinePainter(
                  widget.waveData, widget.paintColor),
            ),
            Text(
              "${widget.update}",
              style: TextStyle(
                  fontSize: 5, color: Color.fromARGB(1, 255, 254, 254)),
            )
          ],
        ));
  }
}

class LinePainter extends CustomPainter {
  List<int> waveData;

  var paintColor;

  LinePainter(this.waveData,  this.paintColor);

  @override
  void paint(Canvas canvas, Size size) {
    if (waveData.isEmpty) {
      return;
    }

    final paint = Paint()
      ..color = Color(paintColor)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final int minY = waveData.reduce(min);
    final int maxY = waveData.reduce(max);
    var dp = (maxY - minY).abs() / 75;
    if (dp == 0) {
      return;
    }
    for (var i = 1; i < waveData.length; i++) {
      int pointY1 = (waveData[i - 1] - minY) ~/ dp;
      int pointY2 = (waveData[i] - minY) ~/ dp;
      int pointX1 = i - 1;
      int pointX2 = i;
      canvas.drawLine(Offset(pointX1.toDouble(), pointY1.toDouble()),
          Offset(pointX2.toDouble(), pointY2.toDouble()), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) =>
      (oldDelegate as LinePainter).waveData != waveData;
}
