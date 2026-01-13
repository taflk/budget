import { computed, ref } from "vue";
import { getCurrentUser } from "../services/appwrite.js";

export const useUser = () => {
  const user = ref(null);
  const isLoadingUser = ref(false);
  let userPromise = null;

  const loadUser = async () => {
    if (user.value) return user.value;
    if (userPromise) return userPromise;
    isLoadingUser.value = true;
    userPromise = getCurrentUser()
      .then((result) => {
        user.value = result;
        return result;
      })
      .finally(() => {
        userPromise = null;
        isLoadingUser.value = false;
      });
    return userPromise;
  };

  const userId = computed(() => user.value?.$id ?? null);

  return { user, userId, isLoadingUser, loadUser };
};
