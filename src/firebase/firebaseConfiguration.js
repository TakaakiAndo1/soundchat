import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBCWXoWyjJgvEgtFbPOarJDQg34qYcv3eU",
    authDomain: "sound-chat-57f4a.firebaseapp.com",
    databaseURL: "https://sound-chat-57f4a.firebaseio.com",
    projectId: "sound-chat-57f4a",
    storageBucket: "sound-chat-57f4a.appspot.com",
    messagingSenderId: "594138020840",
    appId: "1:594138020840:web:c2242c92007af01601825d"
};

export const firebaseApp = firebase.initializeApp(firebaseConfig);

export const firestoreDb = firebase.firestore();

export const cloudStorage = firebase.storage();