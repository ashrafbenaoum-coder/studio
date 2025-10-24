
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

// UID for gds@gds.com
const ADMIN_USER_ID = "92HaO0cvHPPV30OAw4efl4VBBbX2";

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write', // or 'create'/'update' based on options
        requestResourceData: data,
      })
    )
  })
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
  const originalPromise = addDoc(colRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
    
  // Check if it's a store, aisle, or product and duplicate for the admin user
  const pathParts = colRef.path.split('/');
  const userId = pathParts[1];

  // Don't duplicate if the user is the admin
  if (userId !== ADMIN_USER_ID) {
      // Reconstruct admin path and perform the write.
      const adminPath = `users/${ADMIN_USER_ID}/${pathParts.slice(2).join('/')}`;
      const adminColRef = collection(db, adminPath);
      
      addDoc(adminColRef, data).catch(adminError => {
          console.error("Failed to duplicate data for admin:", adminError);
          // Optional: emit a specific error for admin duplication failure,
          // but avoid surfacing it to the end-user unless necessary.
      });
  }


  return originalPromise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
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
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}
