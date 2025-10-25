
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
  collection,
  getFirestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

// UID for gds@gds.com - This should be kept secure and potentially moved to environment variables in a real app
const ADMIN_USER_ID = "92HaO0cvHPPV30OAw4efl4VBBbX2";

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions) {
  const promise = options ? setDoc(docRef, data, options) : setDoc(docRef, data);
  promise.catch(error => {
    console.error(`Error in setDocumentNonBlocking for path ${docRef.path}:`, error);
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write', // Simplified operation for setDoc
        requestResourceData: data,
      })
    )
  });
  // Execution continues immediately
}


/**
 * Initiates an addDoc operation for a collection reference.
 * If the collection is for stores, aisles, or products, it duplicates the write to the admin user's account.
 * Does NOT await the write operation internally.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const db = getFirestore(colRef.firestore.app);
  
  // First, add the document for the original user
  addDoc(colRef, data)
    .then(docRef => {
        // Only duplicate if the original write was successful and the user is not the admin
        const pathParts = colRef.path.split('/');
        const userId = pathParts[1];
        if (userId !== ADMIN_USER_ID) {
            duplicateDataForAdmin(db, pathParts, docRef.id, data);
        }
    })
    .catch(error => {
      console.error(`Error in addDocumentNonBlocking for path ${colRef.path}:`, error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
}

function duplicateDataForAdmin(db: any, originalPathParts: string[], newDocId: string, data: any) {
    let adminPath: string | null = null;
    const collectionType = originalPathParts[originalPathParts.length - 1];

    try {
        if (collectionType === 'stores' && originalPathParts.length === 3) {
            // Path: /users/{userId}/stores -> users/{adminId}/stores
            adminPath = `users/${ADMIN_USER_ID}/stores`;
            const adminColRef = collection(db, adminPath);
            setDocumentNonBlocking(doc(adminColRef, newDocId), data); // Use set with newDocId to maintain ID
        } else if (collectionType === 'aisles' && originalPathParts.length === 5) {
            // Path: /users/{userId}/stores/{storeId}/aisles -> users/{adminId}/stores/{storeId}/aisles
            const storeId = originalPathParts[3];
            adminPath = `users/${ADMIN_USER_ID}/stores/${storeId}/aisles`;
            const adminColRef = collection(db, adminPath);
            setDocumentNonBlocking(doc(adminColRef, newDocId), data); // Use set with newDocId
        } else if (collectionType === 'products' && originalPathParts.length === 7) {
            // Path: /users/{userId}/stores/{storeId}/aisles/{aisleId}/products -> ...
            const storeId = originalPathParts[3];
            const aisleId = originalPathParts[5];
            adminPath = `users/${ADMIN_USER_ID}/stores/${storeId}/aisles/${aisleId}/products`;
            const adminColRef = collection(db, adminPath);
            setDocumentNonBlocking(doc(adminColRef, newDocId), data); // Use set with newDocId
        }
    } catch (adminError) {
        console.error(`Failed to construct admin path or write for path ${adminPath}:`, adminError);
    }
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
       console.error(`Error in updateDocumentNonBlocking for path ${docRef.path}:`, error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      console.error(`Error in deleteDocumentNonBlocking for path ${docRef.path}:`, error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}
