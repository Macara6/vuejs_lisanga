
<script setup>
import { userDetail, updateUser, changeUserPassword } from '@/service/Api';
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';

const user = ref(null);
const editMode = ref(false);
const toast = useToast();
const passwordMode = ref(false);
// Champs éditables
const username = ref('');
const email = ref('');
const phone_number = ref('');
const first_name = ref('');
const last_name=ref('');

const oldPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');

const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const isSuperUser = localStorage.getItem('is_superuser') === 'true';

onMounted(async() =>{
    await fetchdUserDetail();
})

function toggleNewPassword() {
  showNewPassword.value = !showNewPassword.value;
}
function toggleConfirmPassword() {
  showConfirmPassword.value = !showConfirmPassword.value;
}

async function fetchdUserDetail(forceReload = false){
  const CACHE_KEY_USER_PROFIL = "cached_user_profil";
  const CACHE_KEY_USER_PROFIL_TIME ="cached_user_profil_time";

   const CACHE_DURATION_USER = 10*10*1000;
   const now = Date.now();

   const cachedUserProfil = localStorage.getItem(CACHE_KEY_USER_PROFIL);
   const cachedTime = localStorage.getItem(CACHE_KEY_USER_PROFIL_TIME);

   if(cachedUserProfil && cachedTime && !forceReload && now - Number(cachedTime) < CACHE_DURATION_USER){
    user.value = JSON.parse(cachedUserProfil);
    return;
   }
    
    try{
        const userId = localStorage.getItem('id');
        const response = await userDetail(userId);
        user.value = response;

        localStorage.setItem(CACHE_KEY_USER_PROFIL, JSON.stringify(response));
        localStorage.setItem(CACHE_KEY_USER_PROFIL_TIME, now.toString());

        username.value = response.username;
        email.value = response.email;
        phone_number.value = response.phone_number;
        first_name.value = response.first_name;
        last_name.value = response.last_name;


    }catch(error){
        console.error("erreur lors du chargement de l'utilisateur:", error);
    }finally{
        
    }
}

function formatLabel(key) {
  return key.replace(/_/g, ' ');
}
function formatValue(key, value) {
  if (key === 'date_joined') return new Date(value).toLocaleDateString();
  return value ?? '-';
}

async function saveChanges(){
    try{
        const userId = localStorage.getItem('id');
        const data={
            username:username.value,
            email:email.value,
            phone_number:phone_number.value,
        };
        if (!isSuperUser) {
            data.matricule = user.value.matricule;
            data.adress = user.value.adress;
        }

        if (isSuperUser){
            data.first_name =first_name.value;
            data.last_name =last_name.value;
        }
        await updateUser(userId, data);

        user.value.username = username.value;
        user.value.email = email.value;
        user.value.phone_number = phone_number.value;
        if(isSuperUser){
            user.value.first_name =first_name.value;
            user.value.last_name = last_name.value;
        }
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Profil mis à jour', life: 3000 });
        editMode.value = false
    }catch(error){
        console.error('error lors de la mise à jours',error);
         toast.add({ severity: 'error', summary: 'Erreur', detail: "Impossible de mettre à jour l'utilisateur", life: 3000 });
    }
}
async function savePassword(){
    if(!oldPassword.value || !newPassword.value || !confirmNewPassword.value){
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Les mots de passe ne correspondent pas', life: 3000 });
      return;
    }
    if(newPassword.value !== confirmNewPassword.value){
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Les mots de passe ne correspondent pas', life: 3000 });
        return;
    }
    try{

        await changeUserPassword({
            old_password:oldPassword.value,
            new_password:newPassword.value
        });
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Mot de passe changé', life: 3000 });
        oldPassword.value ='';
        newPassword.value='';
        confirmNewPassword.value='';
        passwordMode.value = false;
    }catch(error){
        console.error('Erreur lors du changement de mot de passe', error);
        
    }
}

</script>

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-800 flex justify-center items-start py-10">
    <Card class="w-full max-w-3xl p-6 md:p-8 shadow-lg rounded-xl bg-white dark:bg-gray-900">
      <template #content>
        
        <!-- Profil utilisateur -->
        <div v-if="user && !editMode && !passwordMode" class="space-y-6">
          <h2 class="text-2xl font-bold text-center text-gray-700 dark:text-gray-200">Profil Utilisateur</h2>

          <div v-if="isSuperUser" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span class="text-sm text-gray-400">Nom d'utilisateur</span>
              <span class="block font-medium text-gray-700 dark:text-gray-200">{{ user.username }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-400">Nom</span>
              <span class="block font-medium text-gray-700 dark:text-gray-200">{{ user.first_name }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-400">Post-nom</span>
              <span class="block font-medium text-gray-700 dark:text-gray-200">{{ user.last_name }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-400">E-mail</span>
              <span class="block font-medium text-gray-700 dark:text-gray-200">{{ user.email }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-400">Téléphone</span>
              <span class="block font-medium text-gray-700 dark:text-gray-200">{{ user.phone_number }}</span>
            </div>
            <div class="md:col-span-2 text-center mt-4">
              <span class="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-semibold">👑 Administrateur</span>
            </div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="(value, key) in user" :key="key" class="flex flex-col">
              <span class="text-sm text-gray-400 capitalize">{{ formatLabel(key) }}</span>
              <span class="font-medium text-gray-700 dark:text-gray-200">{{ formatValue(key, value) }}</span>
            </div>
            <div class="md:col-span-2 text-center">
              <span class="text-sm text-gray-400">Suppléant</span>
              <span class="font-medium text-gray-700 dark:text-gray-200">{{ user.substitute_name }}</span>
            </div>
          </div>

          <div class="flex justify-center gap-4 mt-6 flex-wrap">
            <Button label="Modifier Profil" icon="pi pi-pencil" @click="editMode = true" class="p-button-rounded p-button-outlined" />
            <Button label="Changer Mot de passe" icon="pi pi-key" @click="passwordMode = true" class="p-button-rounded p-button-outlined" />
          </div>
        </div>

        <!-- Edition profil -->
        <div v-if="editMode" class="flex justify-center mt-4">
          <div class="w-full md:w-96 space-y-4">
            <h2 class="text-2xl font-bold text-center text-gray-700 dark:text-gray-200 mb-4">Modifier Profil</h2>

            <div>
              <label class="block text-sm font-medium mb-1">Nom d'utilisateur</label>
              <InputText v-model="username" class="w-full" />
            </div>

            <div v-if="isSuperUser">
              <label class="block text-sm font-medium mb-1">Nom</label>
              <InputText v-model="first_name" class="w-full" />
            </div>
            <div v-if="isSuperUser">
              <label class="block text-sm font-medium mb-1">Post-nom</label>
              <InputText v-model="last_name" class="w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">E-mail</label>
              <InputText v-model="email" class="w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Téléphone</label>
              <InputText v-model="phone_number" class="w-full" />
            </div>

            <div class="flex justify-between mt-4 flex-wrap gap-2">
              <Button label="Annuler" icon="pi pi-times" text @click="editMode = false" />
              <Button label="Enregistrer" icon="pi pi-check" @click="saveChanges" />
            </div>
          </div>
        </div>

        <!-- Changement mot de passe -->
        <div v-if="passwordMode" class="flex justify-center mt-4">
          <div class="w-full md:w-96 space-y-4">
            <h2 class="text-2xl font-bold text-center text-gray-700 dark:text-gray-200 mb-4">Changer le mot de passe</h2>

            <div>
              <label class="block text-sm font-medium mb-1">Ancien mot de passe</label>
              <Password v-model="oldPassword" placeholder="Ancien mot de passe" :toggleMask="true" :feedback="false" class="w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Nouveau mot de passe</label>
              <Password v-model="newPassword" placeholder="Nouveau mot de passe" :toggleMask="true" :feedback="false" class="w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Confirmer nouveau mot de passe</label>
              <Password v-model="confirmNewPassword" placeholder="Confirmer mot de passe" :toggleMask="true" :feedback="false" class="w-full" />
            </div>

            <div class="flex justify-between mt-4 flex-wrap gap-2">
              <Button label="Annuler" icon="pi pi-times" text @click="passwordMode = false" />
              <Button label="Changer le mot de passe" icon="pi pi-key" @click="savePassword" />
            </div>
          </div>
        </div>

        <!-- Utilisateur non trouvé -->
        <div v-else-if="!user" class="text-red-500 text-center py-4">
          <i class="pi pi-exclamation-triangle"></i>
          <p>Utilisateur non trouvé.</p>
        </div>

      </template>
    </Card>
  </div>
</template>
