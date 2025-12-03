import 'package:flutter/material.dart';

import 'package:get/get.dart';
import 'package:smartring_flutter/src/pages/tabs/bluepage.dart';
import 'package:smartring_flutter/src/pages/tabs/healthpage.dart';

class Tabs extends StatelessWidget {
  Tabs({super.key});
  final RxInt currentIndex = 0.obs;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: const Text("Hc03"),
          centerTitle: true,
        ),
        body: Obx(() => IndexedStack(index: currentIndex.value, children: [
              BluePage(
                tabIndex: currentIndex,
              ),
              HealthPage(tabIndex: currentIndex),
            ])),
        bottomNavigationBar: Obx(
          () => BottomNavigationBar(
              currentIndex: currentIndex.value,
              onTap: (value) {
                currentIndex.value = value;
              },
              items: const [
                BottomNavigationBarItem(
                    icon: Icon(Icons.bluetooth), label: "Blue"),
                BottomNavigationBarItem(
                    icon: Icon(Icons.health_and_safety_outlined),
                    label: "Health"),
              ]),
        ));
  }
}
