<script setup>

import { ref } from 'vue';
import { login } from '@/service/Api';
import { useRouter } from 'vue-router';


const router = useRouter();
const username = ref('');
const password = ref('');
const errorMessage = ref('');
const email = ref('');
const loading = ref(false);
const checked = ref(false);

const handleLogin = async() => {
    errorMessage.value = '';
    if(!username.value || !password.value){
        errorMessage.value='Please enter both username and password';
        return;
    }
    loading.value = true;
    try{
        const userData = await login(username.value, password.value);
        if(userData && userData.token){
            if(userData.is_superuser){
                 router.push('/pages/Accueil')
            } else{
                router.push('/pages/AccueilUser')
            }
           
        } else{
             throw new Error('Login failed: No user data returned');
        }
    } catch(error){
        console.error('Login failed:', error);
        if(error.response && error.response.status == 401){
             errorMessage.value = "compte non trouvé";
        } else{
             errorMessage.value = 'Compte nom trouvee'
        }
    } finally{
             loading.value = false;
        }
}
function pageSetPassword(){
    return router.push('/pages/SetPassword')
}
</script>

<template>
  <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-full p-4">
    <div
      class="w-full max-w-md bg-surface-0 dark:bg-surface-900 py-10 px-6 sm:px-10 rounded-2xl shadow-lg flex flex-col items-center transition-all duration-300"
    >
      <!-- Titre -->
      <div class="text-center mb-8">
        <div class="text-surface-900 dark:text-surface-0 text-4xl font-bold mb-2 tracking-wide">
          GECLUB
        </div>
        <span class="text-muted-color font-medium">Connectez-vous pour continuer</span>
        <div v-if="errorMessage" class="text-red-500 mt-3 text-center text-sm">
          {{ errorMessage }}
        </div>
      </div>

      <!-- Formulaire -->
      <div class="w-full">
        <label
          for="username"
          class="block text-surface-900 dark:text-surface-0 text-base sm:text-lg font-medium mb-2"
          >Nom d'utilisateur</label
        >
        <InputText
          id="username"
          type="text"
          placeholder="Entrez votre nom d'utilisateur"
          class="w-full mb-6"
          v-model="username"
        />

        <label
          for="password"
          class="block text-surface-900 dark:text-surface-0 text-base sm:text-lg font-medium mb-2"
          >Mot de passe</label
        >
        <Password
          id="password"
          v-model="password"
          placeholder="Mot de passe"
          :toggleMask="true"
          class="w-full mb-4"
          fluid
          :feedback="false"
        ></Password>

        <!-- Lien mot de passe oublié -->
        <div class="flex items-center justify-end mb-6">
          <span
            @click="pageSetPassword"
            class="font-medium no-underline text-right cursor-pointer text-primary text-sm sm:text-base hover:underline"
          >
            Mot de passe oublié ?
          </span>
        </div>

        <!-- Bouton connexion -->
        <Button
          label="Se connecter"
          class="w-full flex justify-center items-center gap-2 text-base sm:text-lg py-3"
          @click="handleLogin"
          :disabled="loading"
        >
          <i v-if="loading" class="pi pi-spin pi-spinner text-white text-lg"></i>
        </Button>
      </div>

      <!-- Logo -->
      <img
        src="/demo/bilatech_log.png"
        alt="bilatech logo"
        class="h-28 sm:h-40 mx-auto my-8 object-contain transition-all duration-300"
      />

      <!-- Footer -->
      <p class="text-gray-400 text-xs text-center">
        © {{ new Date().getFullYear() }} Bilatech — Tous droits réservés
      </p>
    </div>
  </div>
</template>



