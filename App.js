import Expo, { Notifications } from 'expo';
import React, { Component } from 'react';
import { StyleSheet, Platform, Dimensions, View, WebView, StatusBar, Alert, Linking } from 'react-native';
import { SimpleLineIcons, AntDesign, Octicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as firebase from 'firebase';
import registerForNotifications from './services/pushNotifications';


const config = {
  apiKey: 'your fire base app key',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: ""
};

const url = 'http://192.168.3.26:7700';
const deviceWindow = Dimensions.get('window');
const deviceWidth = deviceWindow.width;
const deviceHeight = deviceWindow.height;

firebase.initializeApp(config);

const patchPostMessageFunction = function() {

  var originalPostMessage = window.postMessage;

  var patchedPostMessage = function(message, targetOrigin, transfer) { 
    originalPostMessage(message, targetOrigin, transfer);
  };

  patchedPostMessage.toString = function() { 
    return String(Object.hasOwnProperty).replace('hasOwnProperty', 'postMessage');
  };

  window.postMessage = patchedPostMessage;
};

const patchPostMessageJsCode = '(' + String(patchPostMessageFunction) + ')();';

export default class App extends Component {
  
  state = {
    canGoBack : false,
    canGoForward : false,
    currentUrl : null,
  }

  componentDidMount(){
    registerForNotifications();
    Notifications.addListener((notification) =>{ 

      const { data , origin } = notification;
      
      if(origin === 'received'){
        console.log(Object.keys(data));
      }
      
    });

    Linking.addEventListener('url', this.handleOpenURL);

  }

  componentWillUnmount() { // C
    Linking.removeEventListener('url', this.handleOpenURL);
  }

  handleOpenURL = (event) => { // D
    this.navigate(event.url);
  }


  navigate = (url) => { // E
    const { navigate } = this.props.navigation;
    const route = url.replace(/.*?:\/\//g, '');
    const id = route.match(/\/([^\/]+)\/?$/)[1];
    const routeName = route.split('/')[0];
  
    console.log(routeName);
  }


  handleOpenWebBrowser({data}) {
    Linking.openURL(data);
  }

  onWebViewMessage(event) {
    let msgData;
    try {
      msgData = JSON.parse(event.nativeEvent.data);
    } catch (err) {
      console.warn(err);
      return;
    }

    switch (msgData.targetFunc) {
      
      case "handleOpenWebBrowser":
        this[msgData.targetFunc].apply(this, [msgData]);
        break;

      default :
        console.log(msgData.targetFunc);
        break;
    }
  }

  render() {

    const { canGoBack, canGoForward  } = this.state;
    const nativeIconSize = 25;

    return (
      <View style={styles.container}>
        <StatusBar hidden={true} ></StatusBar>
        <WebView 
          ref={component => {this.webView = component}} 
          source={{ url }} 
          onNavigationStateChange={(e)=>{
            this.setState({
              canGoBack : e.canGoBack,
              canGoForward : e.canGoForward,
            })
          }}
          injectedJavaScript={patchPostMessageJsCode}
          onMessage={this.onWebViewMessage.bind(this)}
          domStorageEnabled={true}
          startInLoadingState={true}
          style={styles.webView}
        />
        <View style={styles.nativeBar}>
            <SimpleLineIcons name={'home'} size={nativeIconSize}  style={styles.nativeBarIcon} onPress={() => {
              this.webView.injectJavaScript('location.href = "/";');
            }} />
            <Octicons name={'chevron-left'} size={nativeIconSize} style={styles.nativeBarIcon} onPress={() => {
              if(canGoBack){
                this.webView.goBack();
              } else{
                Alert.alert(
                  '체인지TV',
                  '어플을 종료하시겠습니까?',
                  [
                    {text: '아니요', onPress: () => console.log('아니요'), style: 'cancel'},
                    {text: '네', onPress: () => Alert.alert('사실 끌 줄모르지롱')},
                  ],
                  { cancelable: false }
                  )
              }
            }} />
            <Octicons name={'chevron-right'} size={nativeIconSize}  style={styles.nativeBarIcon} onPress={() => {
              if(canGoBack){
                this.webView.goForward();
              } else{
                Alert.alert('첫번째 페이지');
              }
            }} />
            <MaterialCommunityIcons name={'refresh'} size={nativeIconSize} style={styles.nativeBarIcon} onPress={() => {
              this.webView.reload();
            }} />
            <SimpleLineIcons name={'share'} size={nativeIconSize} style={styles.nativeBarIcon} onPress={() => {
              this.webView.postMessage('openSharePop');
            }} />
            <AntDesign name={'setting'}  size={nativeIconSize} style={styles.nativeBarIcon} onPress={() => {
              this.webView.postMessage('settings');
            }} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection : 'column',
    marginTop : 20,
  },
  webView : {
    flex : 1,
  },
  nativeBar : {
    flexDirection : 'row',
    height : 40,
    paddingLeft : 10,
    paddingRight : 10,
    justifyContent : 'space-around',
    alignItems : 'center',
    backgroundColor : '#353535',
  },
  nativeBarIcon : {
    color : 'white',
  }
});
