import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./db.js";

async function testFirestore() {
  try {
    await setDoc(doc(db, "testCollection", "testDoc"), { hello: "world" });
    console.log("✅ Write successful.");

    const docSnap = await getDoc(doc(db, "testCollection", "testDoc"));
    if (docSnap.exists()) {
      console.log("✅ Read successful:", docSnap.data());
    } else {
      console.log("❌ No such document!");
    }
  } catch (error) {
    console.error("🔥 Error testing Firestore:", error);
  }
}

testFirestore();
