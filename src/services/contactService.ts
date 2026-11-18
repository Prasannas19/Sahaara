import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/db';
import type { ContactInquiry } from '../types';

export interface SubmitContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitContactInquiry(
  input: SubmitContactInput
): Promise<ContactInquiry> {
  const name = input.name.trim();
  const email = input.email.trim();
  const subject = input.subject.trim();
  const message = input.message.trim();

  // Client and boundary validation
  if (!name) {
    throw new Error('Please enter your full name.');
  }
  if (!email || !email.includes('@') || !email.includes('.')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!subject) {
    throw new Error('Please enter a message subject.');
  }
  if (!message || message.length < 10) {
    throw new Error('Message must be at least 10 characters long.');
  }

  const docRef = doc(collection(db, 'contactInquiries'));
  const inquiryId = docRef.id;

  const inquiry: ContactInquiry = {
    inquiryId,
    name,
    email,
    subject,
    message,
    createdAt: new Date().toISOString(),
    status: 'new',
  };

  await setDoc(docRef, {
    ...inquiry,
    createdAtServer: serverTimestamp(),
  });

  return inquiry;
}
