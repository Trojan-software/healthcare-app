package com.example.smartring_flutter

import android.app.Activity
import android.util.Log
import com.ecg.Constant
import com.ecg.EcgListener
import com.ecg.EcgManager
import io.flutter.plugin.common.BasicMessageChannel
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.StandardMessageCodec
import java.util.*

class EcgPlugin(var activity: Activity, messenger: BinaryMessenger): BasicMessageChannel.MessageHandler<Any>, EcgListener {
    private val TAG:String="EcgPlugin"
    private val channelName="ecgMessageChannel"
    private var channel: BasicMessageChannel<Any>
    private var ecgManager:EcgManager
    init {
        channel = BasicMessageChannel(messenger, channelName, StandardMessageCodec())
        channel.setMessageHandler(this)
        ecgManager = EcgManager.getInstance()
        ecgManager.init()
        ecgManager.setOnEcgResultListener(this)
    }

    fun sendMessageToFlutter(map: Map<String,Any>){
        activity.runOnUiThread {
            channel.send(map)
        }
    }


    override fun onMessage(message: Any?, reply: BasicMessageChannel.Reply<Any>) {
        val bytes = message as ArrayList<Int>

        val byteArray=ByteArray(bytes.size);
        var index=0
        for (value in bytes){
            byteArray[index++] = value.toByte()
        }
        ecgManager.dealEcgVal(byteArray)
    }

    override fun onDrawWave(wave: Int) {
        var map= mutableMapOf<String, Any>("type" to "wave","data" to wave)
        sendMessageToFlutter(map)
    }

    override fun onSignalQuality(level: Int) {
    }

    override fun onECGValues(key: Int, value: Int) {
        // Log.e("czq","onECGValues  key"+key)
        var type = ""
        when (key) {
            Constant.ECG_KEY_HEART_RATE -> type = "HR"
            Constant.ECG_KEY_ROBUST_HR -> type = "ROBUST HR"
            Constant.ECG_KEY_MOOD -> type = "Mood Index"
            Constant.ECG_KEY_R2R -> type = "RR"
            Constant.ECG_KEY_HRV -> type = "HRV"
            Constant.ECG_KEY_HEART_AGE -> type = "HEART AGE"
            Constant.ECG_KEY_STRESS -> type = "STRESS"
            Constant.ECG_KEY_HEART_BEAT -> type = "HEART BEAT"
            Constant.ECG_KEY_RESPIRATORY_RATE -> type = "RESPIRATORY RATE"
        }
        var map= mutableMapOf<String, Any>("type" to type,"value" to value)
        sendMessageToFlutter(map)
    }

    override fun onFingerDetection(fingerDetected: Boolean) {
        var map= mutableMapOf<String, Any>("type" to "touch","isTouch" to fingerDetected)
        sendMessageToFlutter(map)
    }
}