import { Permissions, Notifications} from 'expo';
import { AsyncStorage, Alert } from "react-native";
import * as axios from 'axios';

const PUSH_ENDPOINT = 'http://rallycoding.herokuapp.com/api/tokens'

var instance = axios.create();
instance.defaults.baseURL = PUSH_ENDPOINT;
instance.defaults.timeout = 20000;

export default async () => {
    let previousToken = await AsyncStorage.getItem('pushtoken');
    console.log(previousToken);
    if(previousToken){
        return;
    } else{
        const { status : existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
          finalStatus = status;
        }
      
        if (finalStatus !== 'granted') {
          return;
        }
      
        let token = await Notifications.getExpoPushTokenAsync();

    //     // await axios.post(PUSH_ENDPOINT, {token : {token}});
        console.log(token);
        AsyncStorage.setItem('pushtoken', token);
    }

   

      
};