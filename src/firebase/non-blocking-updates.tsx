
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
  doc,
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
        if (pathParts.length > 1) {
            const userId = pathParts[1];
            if (userId !== ADMIN_USER_ID) {
                // Construct the admin path by replacing the userId with the admin's UID
                const adminPath = [ "users", ADMIN_USER_ID, ...pathParts.slice(2)].join('/');
                const adminDocRef = doc(db, adminPath, docRef.id);
                // Use setDoc with the new docRef.id to ensure the ID is the same
                setDocumentNonBlocking(adminDocRef, data);
            }
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
