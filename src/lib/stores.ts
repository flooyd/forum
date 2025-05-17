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
//edit commemt modal is boolean or null
export const editCommentModal: Writable<boolean | null> = writable(null);;
const threads: Writable<any[]> = writable([]);

export { currentPage, token, user, createThreadModal, threads };