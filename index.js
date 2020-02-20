
const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp(functions.config().firebase);

let db = admin.firestore();


exports.sendPushMessage = functions.firestore
    .document('matches_messages/{fromUserUid}/{toUserUid}/{messageUid}')
    .onCreate((snap, context) => {
        const newValue = snap.data();
        var newText = '';
        const toUid = newValue['toId'];
        const fromUid = newValue['fromId'];
        const id = context.params.fromUserUid;
        const newType = newValue['MediaType'];

        if (newType === 'TEXT'){
          newText = newValue['text'];
        }else if (newType === 'VIDEO') {
          newText = 'You got a Video';
        }else if (newType === 'PHOTO') {
          newText = 'You got a Photo';
        }else if (newType === 'RECORD') {
          newText = 'You got a Record';
        }

        if (id === fromUid) {
            return db.collection('users').doc(String(fromUid)).get()
                .then(doc => {
                    if (doc.exists === true) {
                        console.log('Document Data:', doc.data().fullName);


                        return db.collection('users').doc(String(toUid)).get()
                            .then(otherDoc => {
                                if (otherDoc.exists === true) {
                                    console.log('Document Data:', otherDoc.data().fullName);

                                    var message = {
                                        notification: {
                                            title: doc.data().fullName,
                                            body: newText
                                        },
                                        data: {
                                            uid: String(doc.data().uid),
                                            name: String(doc.data().fullName),
                                            profileImageUrl: String(doc.data().imageUrl1),
                                            fcmToken: String(doc.data().fcmToken)
                                        },
                                        token: otherDoc.data().fcmToken,
                                    };
                                    admin.messaging().send(message)
                                        .then((response) => {
                                            // Response is a message ID string.
                                            console.log('Successfully sent message:', response);
                                            return null;
                                        })
                                        .catch((error) => {
                                            console.log('Error sending message:', error);
                                        });

                                    return otherDoc.data()
                                } else {
                                    console.log('No such document!');
                                    throw new Error("Profile doesn't exist")
                                }
                            })
                            .catch(err => {
                                console.log('Error getting document', err);
                            });


                    } else {
                        console.log('No such document!');
                        throw new Error("Profile doesn't exist")
                    }
                })
                .catch(err => {
                    console.log('Error getting document', err);
                });
        } else {
            return null;
        }

    })
