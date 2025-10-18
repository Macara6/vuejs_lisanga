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
   
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
  <div class="flex flex-col items-center justify-center">
    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 rounded-lg shadow-lg">
      <div class="text-center mb-8">
        <!-- Logo SVG -->

        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">GECLUB</div>
        <span class="text-muted-color font-medium">connecter pour continuer</span>
        <div v-if="errorMessage" class="text-red-500 mt-2 text-center w-full">{{ errorMessage }}</div>
      </div>

      <div>
        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Nom d'utilisateur</label>
        <InputText id="email1" type="text" placeholder="nom d'utilisateur" class="w-full md:w-[30rem] mb-8" v-model="username" />

        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Mot de passe </label>
        <Password id="password1" v-model="password" placeholder="mot de passe" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>

        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
          <span @click="pageSetPassword" class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Mot de passe oublié</span>
        </div>

        <Button
          label="Se connecter"
          class="w-full flex justify-center items-center gap-2"
          @click="handleLogin"
          :disabled="loading"
        >
          <i v-if="loading" class="pi pi-spin pi-spinner text-white"></i>
        </Button>

        <img src="/demo/bilatech_log.png" alt="bilatech logo" class="h-40 mx-auto mb-4">

        <p class="text-gray-400 text-xs text-center mt-6">
          © {{ new Date().getFullYear() }} Bilatech — Tous droits réservés
        </p>
      </div>
    </div>
  </div>
</div>

</template>


