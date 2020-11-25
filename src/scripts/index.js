import firebase from 'firebase';
import 'firebase/auth';
import '../firebase/firebaseConfiguration';
import {
    assignClick,
    initializeSigninButtons,
    addSongToMySongs,
    addArtistToList,
    addCommentToContainer
} from './utilities';
import {
    googleSignin,
    facebookSignin,
    twitterSignin,
    signOut,
    emailSignin,
    createEmailSigninAccount,
    anonymousSignin
} from "../firebase/firebaseAuthentication";
import {
    deleteSongFromFirestore,
    getAllArtists,
    getArtistName,
    getAudioFromStorage, getCommentsForSong,
    getSongFromFirestore,
    readSongsFromFireStore,
    saveCommentToFirestore,
    updateSongInFirebase,
    writeSongToFirestore
} from '../firebase/firebaseRepository';
import {firestoreDb} from "../firebase/firebaseConfiguration";

initializeSigninButtons();
anonymousSignin();

assignClick('signin-google', googleSignin);
assignClick('signin-facebook', facebookSignin);
assignClick('signin-twitter', twitterSignin);
assignClick('appbar-signout-button', signOut);

const emailSigninForm = document.getElementById('email-signin-form');
if (emailSigninForm) {
    emailSigninForm.onsubmit = (event) => {
        event.preventDefault();
        const email = event.target['email-input'].value;
        const password = event.target['password-input'].value;
        emailSignin(email, password);
    }
}

const createEmailSigninForm = document.getElementById('create-email-signin');
if (createEmailSigninForm) {
    createEmailSigninForm.onsubmit = (event) => {
        event.preventDefault();
        const email = event.target['email-input'].value;
        const password = event.target['password-input'].value;
        createEmailSigninAccount(email, password);
    }
}

const createTuneForm = document.getElementById('add-tune-form');
if (createTuneForm) {
    createTuneForm.onsubmit = (event) => {
        event.preventDefault();
        const songArtist = event.target['artist-input'].value;
        const songTitle = event.target['song-title-input'].value;
        const songFile = event.target['song-file'].files[0];
        writeSongToFirestore(songArtist, songTitle, songFile);
    }
}

const mySongsComponent = document.getElementById('my-songs-component');
if (mySongsComponent) {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            readSongsFromFireStore(user.uid)
                .then((songs) => {
                    songs.forEach((song) => {
                        addSongToMySongs(mySongsComponent, song);
                    })
                });
        }
    });
}

window.deleteSong = function (id) {
    deleteSongFromFirestore(id)
        // 削除が完了しだい、画面を再表示。
        .then(() => window.location.reload());
}

const editSongForm = document.getElementById('edit-tune-form');
if (editSongForm) {
    const searchParams = new URLSearchParams(location.search);
    const songId = searchParams.get('id');
    // Get song from Firestore
    getSongFromFirestore(songId)
        .then((song) => {
            // Populate the form with song artist, song title and song id
            editSongForm.elements['song-id'].value = song.id;
            editSongForm.elements['song-title-input-edit'].value = song.songTitle;
        });

    // Create on submit function
    editSongForm.onsubmit = (event) => {
        event.preventDefault();
        const id = event.target['song-id'].value;
        const songTitle = event.target['song-title-input-edit'].value;
        const song = {id, songTitle};
        updateSongInFirebase(song);
    }
}

const audioElement = document.getElementById('audio-component');
const artistNameElement = document.getElementById('artist-name');
const songSelectElement = document.getElementById('song-select');
const commentsContainer = document.getElementById('comments-container');
if (audioElement && artistNameElement && songSelectElement && commentsContainer) {

    // Get search params
    const searchParams = new URLSearchParams(location.search);
    const userId = searchParams.get('userid');

    // Set artist name
    getArtistName(userId)
        .then((artistName) => {
            artistNameElement.innerText = artistName
        });

    // Set all songs for the user id
    readSongsFromFireStore(userId)
        .then((songs) => {
            songs.forEach((song) => {
                const optionElement = document.createElement('option');
                optionElement.setAttribute('data-songid', song.id);
                optionElement.setAttribute('data-filename', song.songFileName);
                optionElement.innerText = song.songTitle;
                songSelectElement.append(optionElement);
            });
        });

    songSelectElement.onchange = (event) => {
        const selectedOption = event.target.selectedOptions[0];
        const songId = selectedOption.dataset.songid;
        const fullFileName = `${songId}-${selectedOption.dataset.filename}`;

        // Set audio src
        getAudioFromStorage(userId, fullFileName)
            .then((fileUrl) => {
                audioElement.setAttribute('src', fileUrl);
            });

        // Get all song related comments

        // また、リアルタイム更新リスナーを使用しなくなったら、それを切り離す必要があります。そうしないと、コールバック関数が呼び出され続け、バグが発生します。
        // これを行うために、onSnapshotメソッドはサブスクライブ解除関数を返します。これをグローバルウィンドウ変数に割り当てます。
        // 次に、別のリアルタイムリスナーを初期化する前に、前のリスナーがあるかどうかを確認してから、サブスクライブを解除します。
        window.unsubscribe && window.unsubscribe();

        window.unsubscribe =  firestoreDb.collection('comments')
            .where('songId', '==', songId)
            .orderBy('date', 'desc')
            .onSnapshot((querySnapshot) => {
                commentsContainer.innerHTML = ''; // Clear all comments from element first
                querySnapshot.forEach((comment) => {
                    addCommentToContainer(comment.data(), commentsContainer);
                });
            });
    }
}

const selectArtistElement = document.getElementById('select-artist')
if (selectArtistElement) {
    getAllArtists()
        .then((artists) => {
            artists.forEach((artist) => {
                addArtistToList(selectArtistElement, artist);
            });
        });
}

const addCommentForm = document.getElementById('add-comment-form');
if (addCommentForm) {
    addCommentForm.onsubmit = (event) => {
        event.preventDefault();
        const commentText = event.target['comment-text'].value;
        const songSelect = document.getElementById('song-select');
        const selectedOption = songSelect.selectedOptions[0];
        const songId = selectedOption.dataset.songid;
        saveCommentToFirestore(commentText, songId);
    }
}