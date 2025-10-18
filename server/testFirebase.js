import { db } from './firebase.js';
import { doc, setDoc, getDoc } from "firebase/firestore";

async function testFirestore() {
  try {
    // Write test
    await setDoc(doc(db, "testCollection", "testDoc"), { hello: "world" });
    console.log('Write successful.');

    // Read test
    const docSnap = await getDoc(doc(db, "testCollection", "testDoc"));
    if (docSnap.exists()) {
      console.log('Read successful:', docSnap.data());
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error testing Firestore:', error);
  }
}

testFirestore();