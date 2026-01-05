import {
  Account,
  Client,
  Databases,
  ID,
  Permission,
  Query,
  Role,
  Teams,
} from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
const databases = new Databases(client);
const teams = new Teams(client);
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const collectionId = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
const categoryCollectionId =
  import.meta.env.VITE_APPWRITE_CATEGORY_COLLECTION_ID;
const teamId = import.meta.env.VITE_APPWRITE_TEAM_ID;

export const loginWithEmail = (email, password) =>
  account.createEmailPasswordSession(email, password);

export const createAccount = (email, password, name = "") =>
  account.create("unique()", email, password, name);

export const logoutCurrent = () => account.deleteSession("current");

let currentUser = null;
let currentUserPromise = null;

export const getCurrentUser = async () => {
  if (currentUser) return currentUser;
  if (currentUserPromise) return currentUserPromise;
  currentUserPromise = account
    .get()
    .then((user) => {
      currentUser = user;
      return user;
    })
    .catch(() => {
      currentUser = null;
      return null;
    })
    .finally(() => {
      currentUserPromise = null;
    });
  return currentUserPromise;
};

export const getPrefs = () => account.getPrefs();

export const updatePrefs = (prefs) => account.updatePrefs(prefs);

export const listEntries = (month, userId) =>
  databases.listDocuments(databaseId, collectionId, [
    Query.equal("month", month),
    Query.equal("userId", userId),
    Query.orderDesc("$createdAt"),
  ]);

export const createEntry = (data, userId) =>
  databases.createDocument(databaseId, collectionId, ID.unique(), data, [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]);

export const updateEntry = (documentId, data) =>
  databases.updateDocument(databaseId, collectionId, documentId, data);

export const deleteEntry = (documentId) =>
  databases.deleteDocument(databaseId, collectionId, documentId);

export const listCategories = (userId) =>
  databases.listDocuments(databaseId, categoryCollectionId, [
    Query.equal("userId", userId),
    Query.orderAsc("name"),
  ]);

export const createCategory = (data, userId) =>
  databases.createDocument(databaseId, categoryCollectionId, ID.unique(), data, [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]);

export const updateCategory = (documentId, data) =>
  databases.updateDocument(databaseId, categoryCollectionId, documentId, data);

export const deleteCategory = (documentId) =>
  databases.deleteDocument(databaseId, categoryCollectionId, documentId);

export const listTeamMemberships = () => teams.listMemberships(teamId);

export const inviteTeamMember = (email, roles, url, name) => {
  const payload = { teamId, roles, email, url };
  if (name && name.trim().length > 0) {
    payload.name = name.trim();
  }
  return teams.createMembership(payload);
};
