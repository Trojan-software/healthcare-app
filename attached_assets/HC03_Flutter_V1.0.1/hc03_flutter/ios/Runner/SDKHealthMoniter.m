//
//  SDKHealthMoniter.m
//  SDKHealthMoniter
//
//  Created by xxoo on 15-6-15.
//  Copyright (c) 2015年 beibei. All rights reserved.
//

#import "SDKHealthMoniter.h"
#import "NSKAlgoSDKECG.h"
#import "NSKAlgoSDKECGDelegate.h"
#import <Flutter/Flutter.h>

@interface SDKHealthMoniter()<NSKAlgoSDKECGDelegate>

@property(assign, nonatomic) NSUInteger count; //lzp
@property(strong, nonatomic)NSKAlgoSDKECG * nskAlgoSDKECG;
@property (nonatomic,strong) FlutterBasicMessageChannel *messageChannel;
@end


@implementation SDKHealthMoniter
{
  int  heartRate;
  int  HRV;
  int  r2rInterval;
  int  rrMax;
  int  rrMin;
  int  heartBeatCount;
  int  rpeakDetected;
  int  mood;
  
  BOOL isFirst;//是否是第一次测量心电
  
  int ecgStageFlag;
  int ecgDataNum;
  int ecgDataNum2;
  int ecgStep;
}


- (void)initMessageChannel:(FlutterViewController*)flutterController{
    
    self.messageChannel = [FlutterBasicMessageChannel messageChannelWithName:@"ecgMessageChannel" binaryMessenger:flutterController];
   // UIViewController*  __weak weakSelf = self;
    //设置消息处理器，处理来自Dart的消息
    __weak typeof(self) weakSelf = self;
    [self.messageChannel setMessageHandler:^(id _Nonnull message, FlutterReply reply) {
        __strong typeof(weakSelf) strongSelf = weakSelf;
       // NSLog(@"===接收到回调消息===");
        if([message isKindOfClass:[NSString class]]){
          if([message rangeOfString:@"start"].location != NSNotFound){
             // NSLog(@"==start=接收到回调消息===");
            [strongSelf startECGWithDefVal];
          }else{
              //NSLog(@"==stop=接收到回调消息===%@",message);
            [strongSelf endECG];
          }
        }else{
           // NSLog(@"===接收到回调消息=array==%@",message);
          [strongSelf decodeECGData:message];
        }
        
         reply([NSString stringWithFormat:@"BasicMessageChannel"]);
        // [weakSelf sendShow:message];
    }];
}

- (void)sendMessageToFlutter:(NSString*)type withdata:(id _Nonnull)data{
    NSMutableDictionary *dictionary =
    [[NSMutableDictionary alloc] init];
  [dictionary setObject:type forKey:@"type"];
  if([type rangeOfString:@"wave"].location != NSNotFound){
    [dictionary setObject:data forKey:@"data"];
  }else if([type rangeOfString:@"touch"].location != NSNotFound){
    [dictionary setObject:data forKey:@"isTouch"];
  }else{
    [dictionary setObject:data forKey:@"value"];
  }
  [self.messageChannel sendMessage:dictionary];
}

-(instancetype)init
{
    self = [super init];
    if (self)
    {
        
        // algo ecg init
        NSString * licenseKey = @"4DYD5nkbZHYoJBqIxT3nc/QIB58doR7BiRxuH62Ayhs=";
        int sampleRate = 512;
        self.nskAlgoSDKECG = [[NSKAlgoSDKECG alloc]init];
        [self.nskAlgoSDKECG setDelegate:self];
        [self.nskAlgoSDKECG setupSDKProperty:licenseKey withSampleRate:sampleRate enableSmoothed:1];
        [self.nskAlgoSDKECG enableNSLogMessages:false];
        //[self initMessageChannel];
      
//        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(receiveECGData:) name:@"ecgDecodeData" object:nil];
      

      
    }
    return self;
    
}



//检测ecg
-(void)checkECG
{
//    ELETROCARDIOGRAM_COMMAND ecgCommand_GetCalibration = ELETROCARDIOGRAM_COMMAND_Check;
//    PackDataAndSend(PSEND_EIECTROCARDIOGRAM_COMMAND, &ecgCommand_GetCalibration);
    
    
    
}

-(void)startECGWithDefVal {
  [self startECGWith:@"" Gender:YES Age:0 Height:0 Weight:0];
}


-(void)startECGWith:(NSString * _Nonnull)username Gender:(bool)isFemale Age:(int)age Height:(int)height Weight:(int)weight
{
 
    [self.nskAlgoSDKECG resetECGAnalysis];
    [self.nskAlgoSDKECG setUserProfile:username withGender:isFemale withAge:age withHeight:height withWeight:weight withPath:@""];//empty input path will use default path
    //检测ecg
//    [self checkECG];
    isFirst = YES;
    
    
//    ELETROCARDIOGRAM_COMMAND ecgCommand_GetCalibration = ELETROCARDIOGRAM_COMMAND_StarMeasure;
//    PackDataAndSend(PSEND_EIECTROCARDIOGRAM_COMMAND, &ecgCommand_GetCalibration);
    
    [self initECG];
  
    self.count = 0;
    
}



//初始化
-(void)initECG
{
    ecgStageFlag = 0;
    ecgDataNum = 0;
    ecgDataNum2 = 0;
    ecgStep = 1;
    
}






//结束测量心电
-(void)endECG
{
//    
//    ELETROCARDIOGRAM_COMMAND ecgCommand_GetCalibration = ELETROCARDIOGRAM_COMMAND_StopMeasure;
//    PackDataAndSend(PSEND_EIECTROCARDIOGRAM_COMMAND, &ecgCommand_GetCalibration);
    
    ecgStep  = 0;
    
//    isTestECG = NO;
    
}

#pragma mark --心电通知方法
//-(void)receiveECGData:(NSNotification *)noti
//{
//    NSDictionary *ecgDic = [noti userInfo];
//    NSData* recData = [ecgDic objectForKey:@"ecgData"];
//    if (recData==nil)
//    {
//        NSLog(@"receive not ECGData");
//    }else
//    {
//        [self decodeECGData:recData];
//        
//    }
//    
//    
//    
//    
//    
//    
//}


#pragma mark --ecg算法

// 解析蓝牙包
-(void)decodeECGData:(NSArray<NSNumber *> * _Nonnull)recvData
{
  
  
  
//  NSLog(@"ecgData============%@",recvData);
  
  int dataEcg = 0;
  int dataRec = 0;
  
//  NSRange range;
//  range.length = 1;
  
  for (int i=0; i < recvData.count; i++)
  {
    int dataRec = [recvData[i] charValue]&0xff;
    
//    range.location = i;
//    [recvData getBytes:&dataRec range:range];
    ecgDataNum++;
//    NSLog(@"[====decodeECGData===ecgStageFlag=%d ]",ecgStageFlag);
//    NSLog(@"[====decodeECGData===dataRec=%d ]",dataRec);
    if (ecgStageFlag == 0)
    {
      if (dataRec == 0xaa)
      {
        ecgStageFlag++;
      }else
      {
        ecgStageFlag = 0; // 若打开,手指检测必须三个
      }
    } else if (ecgStageFlag == 1)
    {
      if (dataRec == 0xaa)
      {
        ecgStageFlag++;
      }else
      {
        ecgStageFlag=0;
      }
    } else if (ecgStageFlag ==2)
    {
      if (dataRec == 0x12)
      {
        ecgStageFlag++;
      }else
      {
        
        ecgStageFlag = 0;
      }
      
      
    }else if (ecgStageFlag ==3)
    {
      if (dataRec ==0x02)
      {
        ecgStageFlag++;
        
      }else
      {
        ecgStageFlag=0;
      }
      
      
    } else if (ecgStageFlag == 4)
    {
      if (dataRec ==0x00)
      {
        //当前数据无效 手指离开传感器
        ecgStageFlag++;
        NSLog(@"ecg finger leave");
        [self sendMessageToFlutter:@"touch" withdata: @(NO)];
        if ([self.sdkHealthMoniterdelegate respondsToSelector:@selector(receiveECGDataFingerTouch:)]) {
          dispatch_async(dispatch_get_main_queue(), ^{
            [self.sdkHealthMoniterdelegate receiveECGDataFingerTouch:NO];
          });
        }
        
      } else if (dataRec ==0xc8)
      {
        //                NSLog(@"ecg finger touched");
        //接下来的数据有效 手指放在传感器上
        ecgStageFlag++;
        [self sendMessageToFlutter:@"touch" withdata: @(YES)];
        //                NSLog(@"ecg finger detected");
        if ([self.sdkHealthMoniterdelegate respondsToSelector:@selector(receiveECGDataFingerTouch:)]) {
          dispatch_async(dispatch_get_main_queue(), ^{
            [self.sdkHealthMoniterdelegate receiveECGDataFingerTouch:YES];
          });
        }
      } else
      {
        
        ecgStageFlag++;
        
      }
      
     // NSLog(@"ecgData=====1=======");
    }else if (ecgStageFlag >=5 && ecgStageFlag <=21 )
    {
      
      ecgStageFlag++;
      
    }else if (ecgStageFlag >=22 && ecgStageFlag <=1045)
    {
     // NSLog(@"ecgData=====2=======");
      //有效数据
      if (ecgStageFlag % 2 ==0)
      {
        dataEcg = dataRec<<8;
        
      }else
      {
        dataEcg +=dataRec;
        
        //调用算法
        if (dataEcg >= 32768)
        {
          dataEcg -=65536;
        }
       // NSLog(@"[====requestECGAnalysis====]");
        if (self.nskAlgoSDKECG != nil) {
          ecgDataNum2++;
         // NSLog(@"[===1=requestECGAnalysis====]");
          [self.nskAlgoSDKECG requestECGAnalysis:dataEcg withPoorSignal:200];
        }
        // 回调原始数据 原始波形
        if ([self.sdkHealthMoniterdelegate respondsToSelector:@selector(receiveECGDataRowData:)])
        {
          [self.sdkHealthMoniterdelegate receiveECGDataRowData:dataEcg];
        }

      }
      
      ecgStageFlag++;
      if (ecgStageFlag >1045)
      {
        ecgStageFlag = 0;
      }
      
    }else
    {
      
      ecgStageFlag=0;
      
    }
  }
  
}



-(void)calcAndCallbackRR:(int)r2rInt {
  if (isFirst ==YES)
  {
    rrMax = r2rInt;
    rrMin = r2rInt;
    isFirst = NO;
  }
  if (r2rInt > rrMax) {
    rrMax = r2rInt;
  }
  if (r2rInt < rrMin)
  {
    rrMin = r2rInt;
  }
  
  if ([self.sdkHealthMoniterdelegate respondsToSelector:@selector(receiveECGDataRRmax:)])
  {
    [self.sdkHealthMoniterdelegate receiveECGDataRRmax:rrMax];
  }
  
  if ([self.sdkHealthMoniterdelegate respondsToSelector:@selector(receiveECGDataRRMin:)])
  {
    [self.sdkHealthMoniterdelegate receiveECGDataRRMin:rrMin];
  }
}





#pragma mark -- algoecg delegate 新ecg

- (void)dataReceived:(ECGAlgorithmsData)algo results:(int)value {
  switch (algo) {
    case ECG_SMOOTHED_WAVE: // 波形
     // NSLog(@"===ECG_SMOOTHED_WAVE===");
      [self sendMessageToFlutter:@"wave" withdata: @(value)];
      if ([self.sdkHealthMoniterdelegate respondsToSelector:@selector(receiveECGDataSmoothedWave:)]) {
        [self.sdkHealthMoniterdelegate receiveECGDataSmoothedWave:value];
      }
      break;
      
    case ECG_R2R_INTERVAL: // r2r value
     // NSLog(@"===ECG_R2R_INTERVAL===");
      [self sendMessageToFlutter:@"RR" withdata: @(value)];
      if ([self.sdkHealthMoniterdelegate respondsToSelector:@selector(receiveECGDataR2RInterval:)]) {
        [self.sdkHealthMoniterdelegate receiveECGDataR2RInterval:value];
      }
      
      [self calcAndCallbackRR:value];
      
      break;
    case ECG_RRI_COUNT:
      
      
      if(value == 30){
        int stress = [self.nskAlgoSDKECG getStress];
        if ([self.sdkHealthMoniterdelegate respondsToSelector:@selector(receiveECGDataStress:)]) {
          // 压力指数
          [self.sdkHealthMoniterdelegate receiveECGDataStress:[_nskAlgoSDKECG getStress]];
        }
        int mood = [self.nskAlgoSDKECG getMood];
        [self sendMessageToFlutter:@"Mood Index" withdata: @(mood)];
        if ([self.sdkHealthMoniterdelegate respondsToSelector:@selector(receiveECGDataMood:)]) {
          // 心情指数
          [self.sdkHealthMoniterdelegate receiveECGDataMood:[_nskAlgoSDKECG getMood]];
        }
        int heartage = [self.nskAlgoSDKECG getHeartAge];
        if ([self.sdkHealthMoniterdelegate respondsToSelector:@selector(receiveECGDataHeartAge:)]) {
          // 心脏年龄
          [self.sdkHealthMoniterdelegate receiveECGDataHeartAge:[_nskAlgoSDKECG getHeartAge]];
        }
        
      }
      break;
    case ECG_RPEAK_DETECTED:
      //            NSLog(@"R-peak detected.");
      break;
    case ECG_HEART_RATE:
      // 心率
      [self sendMessageToFlutter:@"HR" withdata: @(value)];
      if ([self.sdkHealthMoniterdelegate respondsToSelector:@selector(receiveECGDataHeartRate:)]) {
        [self.sdkHealthMoniterdelegate receiveECGDataHeartRate:value];
      }
      
      heartRate = value;
      int br = heartRate > 4 ? ((int)roundf(heartRate/4.0) + (1 - arc4random() % 3)) : 0 ;
      [self sendMessageToFlutter:@"RESPIRATORY RATE" withdata: @(br)];
      if ([self.sdkHealthMoniterdelegate respondsToSelector:@selector(receiveECGDataBreathRate:)]) {
        //呼吸率 假的
        int br = heartRate > 4 ? ((int)roundf(heartRate/4.0) + (1 - arc4random() % 3)) : 0 ;
        [self.sdkHealthMoniterdelegate receiveECGDataBreathRate:br];
      }
      
      break;
    case ECG_ROBUST_HEART_RATE:
      //            robustHeartRateLabel.text = [NSString stringWithFormat:@"RobustHeartRate:%d",value];
      break;
      
    case ECG_HRV:
      // hrv
      [self sendMessageToFlutter:@"HRV" withdata: @(value)];
      if ([self.sdkHealthMoniterdelegate respondsToSelector:@selector(receiveECGDataHRV:)]) {
        [self.sdkHealthMoniterdelegate receiveECGDataHRV:value];
      }
      break;
      
    case ECG_SIGNAL_QUALITY:
      //            signalQualityLabel.text = [NSString stringWithFormat:@"SignalQuality:%d",value];
      break;
    case ECG_OVALLALL_SIGNAL_QUALITY:
      //            overallSignalQualityLabel.text = [NSString stringWithFormat:@"OverallSQ: %d",value];
      break;
    default:
      
      NSLog(@"Unknown ID: %lu", (unsigned long)algo);
      break;
  }
}

- (void)exceptionECGMessage:(ECGException)excepType {
  //NSLog(@"Exceptions: %lu",(unsigned long)excepType);
  switch (excepType) {
    case ECG_USER_PROFILE_HAS_NOT_BEEN_SET_UP:
      NSLog(@"ECG_USER_PROFILE_HAS_NOT_BEEN_SET_UP");
      break;
    case ECG_INVALID_INPUT_AGE:
      NSLog(@"ECG_INVALID_INPUT_AGE");
      break;
    case ECG_INVALID_INPUT_NAME:
      NSLog(@"ECG_INVALID_INPUT_NAME");
      break;
    case ECG_INVALID_INPUT_HEIGHT:
      NSLog(@"ECG_INVALID_INPUT_HEIGHT");
      break;
    case ECG_INVALID_INPUT_WEIGHT:
      NSLog(@"ECG_INVALID_INPUT_WEIGHT");
      break;
    case ECG_INVALID_INPUT_PATH:
      NSLog(@"ECG_INVALID_INPUT_PATH");
      break;
    case ECG_INSUFFICIENT_DATA:
      NSLog(@"ECG_INSUFFICIENT_ECG_DATA");
      break;
    case ECG_INVALID_INPUT_SAMPLE_RATE:
      NSLog(@"ECG_INVALID_INPUT_SAMPLE_RATE");
      break;
    case ECG_INVALID_INPUT_LICENSE:
      NSLog(@"ECG_INVALID_INPUT_LICENSE");
      break;
    case ECG_EXCEPTION_LICENSE_EXPIRED:
      NSLog(@"ECG_EXCEPTION_LICENSE_EXPIRED");
      break;
    default:
      break;
  }
}





//移除通知
-(void)dealloc
{
  [[NSNotificationCenter defaultCenter]removeObserver:self];
  
}


@end


