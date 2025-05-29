import { writable, type Writable } from "svelte/store";

const currentPage = writable("home");
const token: Writable<string | null> = writable(null);
const user: Writable<any> | null = writable({
    id: "",
    username: "",
    email: "",
    displayName: "",
    createdAt: "",
    updatedAt: "",
});
const createThreadModal = writable(false);
const editCommentModal: Writable<boolean | null> = writable(null);
const filterThreadsModal: Writable<boolean | null> = writable(null);
const threads: Writable<any[]> = writable([]);
const originalThreads: Writable<any[]> = writable([]);
const activeFilters: Writable<number[]> = writable([]);
const tagManagerOpen: Writable<number | null> = writable(null);
const users: Writable<any[]> = writable([]);


export {
    currentPage,
    token,
    user,
    createThreadModal,
    editCommentModal, 
    threads, 
    originalThreads,
    activeFilters,
    tagManagerOpen, 
    filterThreadsModal,
    users
};