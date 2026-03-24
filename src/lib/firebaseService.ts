import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { BrainMemory, Message, BrandProfile, KnowledgeItem } from '../types';

export const firebaseService = {
  // Brain Memories
  async saveMemory(memory: Omit<BrainMemory, 'id' | 'createdAt'>) {
    if (!auth.currentUser) return { error: 'User not authenticated' };
    const path = `users/${auth.currentUser.uid}/brainMemories`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...memory,
        createdAt: serverTimestamp()
      });
      return { data: { ...memory, id: docRef.id }, error: null };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return { data: null, error };
    }
  },

  async getMemories(agentId?: string) {
    if (!auth.currentUser) return { data: [], error: 'User not authenticated' };
    const path = `users/${auth.currentUser.uid}/brainMemories`;
    try {
      let q = query(collection(db, path), orderBy('createdAt', 'desc'));
      if (agentId) {
        q = query(collection(db, path), where('agentId', '==', agentId), orderBy('createdAt', 'desc'));
      }
      const snapshot = await getDocs(q);
      const memories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString()
      })) as unknown as BrainMemory[];
      return { data: memories, error: null };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return { data: [], error };
    }
  },

  // Messages
  async saveMessage(chatId: string, message: Omit<Message, 'createdAt'>) {
    if (!auth.currentUser) return { error: 'User not authenticated' };
    const path = `users/${auth.currentUser.uid}/chats/${chatId}/messages`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...message,
        createdAt: serverTimestamp()
      });
      return { data: { ...message, id: docRef.id }, error: null };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return { data: null, error };
    }
  },

  async getMessages(chatId: string) {
    if (!auth.currentUser) return { data: [], error: 'User not authenticated' };
    const path = `users/${auth.currentUser.uid}/chats/${chatId}/messages`;
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString()
      })) as unknown as Message[];
      return { data: messages, error: null };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return { data: [], error };
    }
  },

  // Brand Profile
  async saveBrandProfile(profile: BrandProfile) {
    if (!auth.currentUser) return { error: 'User not authenticated' };
    const path = `users/${auth.currentUser.uid}/brandProfile/current`;
    try {
      await setDoc(doc(db, path), profile);
      return { error: null };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return { error };
    }
  },

  async getBrandProfile() {
    if (!auth.currentUser) return { data: null, error: 'User not authenticated' };
    const path = `users/${auth.currentUser.uid}/brandProfile/current`;
    try {
      const snapshot = await getDoc(doc(db, path));
      if (snapshot.exists()) {
        return { data: snapshot.data() as BrandProfile, error: null };
      }
      return { data: null, error: null };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return { data: null, error };
    }
  },

  // Knowledge Base
  async saveKnowledge(knowledge: Omit<KnowledgeItem, 'id' | 'createdAt'>) {
    if (!auth.currentUser) return { error: 'User not authenticated' };
    const path = `users/${auth.currentUser.uid}/knowledgeBase`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...knowledge,
        createdAt: serverTimestamp()
      });
      return { data: { ...knowledge, id: docRef.id }, error: null };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return { data: null, error };
    }
  },

  async getKnowledge() {
    if (!auth.currentUser) return { data: [], error: 'User not authenticated' };
    const path = `users/${auth.currentUser.uid}/knowledgeBase`;
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const knowledge = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString()
      })) as unknown as KnowledgeItem[];
      return { data: knowledge, error: null };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return { data: [], error };
    }
  }
};
