
import 'package:flutter/material.dart';

class HealthItemWidget extends StatefulWidget {
  String buttonTitle;

  var data;

  var onPressed;

  bool visible;

  double process;

  final Widget? child;

  HealthItemWidget(
      {super.key,
      this.data,
      this.visible = false,
      this.process = 0,
      this.child,
      required this.buttonTitle,
      required this.onPressed});

  @override
  State<HealthItemWidget> createState() => _HealthItemWidgetState();
}

class _HealthItemWidgetState extends State<HealthItemWidget> {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            const SizedBox(width: 10),
            TextButton(
                onPressed: widget.onPressed,
                style: ButtonStyle(
                    backgroundColor:
                        MaterialStateProperty.all(Colors.blue[100])),
                child: Text(
                  widget.buttonTitle,
                )),
            const SizedBox(width: 10),
            widget.child ?? Container(),
            Expanded(
                child: Text(
              widget.data,
              maxLines: 10,
              overflow: TextOverflow.ellipsis,
            )),
          ],
        ),
        Stack(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 8),
              child: Visibility(
                  visible: widget.visible,
                  child: LinearProgressIndicator(
                    backgroundColor: Colors.black, // 背景颜色
                    valueColor:
                        const AlwaysStoppedAnimation(Colors.red), // 进度动画颜色
                    value: widget.process, // 如果进度是确定的，那么可以设置进度百分比，0-1
                  )),
            ),
            const Divider(),
          ],
        )
      ],
    );
  }
}
