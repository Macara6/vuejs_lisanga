
<script setup>
import { ref } from "vue";
import { requestPasswordReset,confirmPasswordReset } from '@/service/Api';
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";

const toast = useToast();
const activeStep = ref(1);
const step = ref(1);
const router = useRouter();
const email = ref("");
const code = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const errors = ref({});
const loading = ref(false);

async function sendResetCode(){
    try{
        loading.value = true;
        await requestPasswordReset(email.value);
        step.value =2;
        toast.add({ severity: "success", summary: "Code envoyé", detail: "Vérifiez votre email.", life: 4000 });
    }catch(error){
        errors.value = error.response?.data || {};
        toast.add({ severity: "error", summary: "Erreur", detail: "Impossible d'envoyer le code.", life: 4000 });
    }finally{
        loading.value = false;
    }
}
async function resetPassword(){
    if(newPassword.value != confirmPassword.value){
        toast.add({ severity: "warn", summary: "Attention", detail: "Les mots de passe ne correspondent pas.", life: 4000 });
        return;
    }
    if(newPassword.value.length < 6){
      toast.add({
      severity: "warn",
      summary: "Mot de passe trop court",
      detail: "Le mot de passe doit contenir au moins 6 caractères.",
      life: 4000,
      });
      return;
    }
    try{
        loading.value= true;
        await confirmPasswordReset({
            email:email.value,
            code:code.value,
            new_password:newPassword.value,
            confirm_password:confirmPassword.value
        });
        step.value =3;
        toast.add({ severity: "success", summary: "Succès", detail: "Mot de passe réinitialisé avec succès.", life: 4000 });
        newReset();
        router.push('/');
    }catch(error){
        errors.value = error.response?.data || {};
         toast.add({ severity: "error", summary: "Erreur", detail: "Impossible de réinitialiser le mot de passe.", life: 4000 });
    }finally{
        loading.value = false;
    }

}

function newReset() {
  email.value = "";
  code.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  step.value = 1;
}



</script>
<template>
  <div class="flex justify-center items-start min-h-screen bg-gray-100 py-12">
    <div class="w-full md:w-3/4 lg:w-1/2">
      <div class="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100">🔑 Mot de passe oublié</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-2">Réinitialisez votre mot de passe en 3 étapes</p>
        </div>

        <!-- Stepper -->
        <div class="flex items-center justify-between mb-10">
          <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold', step===1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600']">1</div>
          <div class="flex-1 h-1 mx-4" :class="step>1 ? 'bg-blue-300' : 'bg-gray-300'"></div>
          <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold', step===2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600']">2</div>
          <div class="flex-1 h-1 mx-4" :class="step>2 ? 'bg-blue-300' : 'bg-gray-300'"></div>
          <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold', step===3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600']">3</div>
        </div>

        <!-- Step 1: Email -->
        <div v-if="step === 1" class="space-y-4">
          <label class="font-medium text-gray-700 dark:text-gray-200">Votre email</label>
          <InputText v-model="email" placeholder="Ex: exemple@mail.com" class="w-full border-gray-300 rounded-lg" />
          <div v-if="errors.email" class="text-red-600 text-sm">
            <div v-for="(e, i) in errors.email" :key="i">{{ e }}</div>
          </div>
          <div class="flex justify-end mt-4">
            <Button label="Suivant" icon="pi pi-arrow-right" class="p-button-rounded p-button-primary" @click="sendResetCode" :loading="loading" />
          </div>
        </div>

        <!-- Step 2: Code -->
        <div v-else-if="step === 2" class="space-y-4">
          <label class="font-medium text-gray-700 dark:text-gray-200">Code de vérification</label>
          <InputText v-model="code" placeholder="Saisir le code reçu par email" class="w-full border-gray-300 rounded-lg" />
          <div v-if="errors.code" class="text-red-600 text-sm">
            <div v-for="(e, i) in errors.code" :key="i">{{ e }}</div>
          </div>
          <div class="flex justify-between mt-6">
            <Button label="Retour" icon="pi pi-arrow-left" outlined @click="step=1" />
            <Button label="Suivant" icon="pi pi-arrow-right" class="p-button-primary p-button-rounded" @click="step=3" />
          </div>
        </div>

        <!-- Step 3: Nouveau mot de passe -->
        <div v-else-if="step === 3" class="space-y-4">
          <label class="font-medium text-gray-700 dark:text-gray-200">Nouveau mot de passe </label>
          <Password v-model="newPassword" :toggleMask="true" :feedback="false" placeholder="Nouveau mot de passe 6 caractères ou plus" class="w-full" />

          <label class="font-medium text-gray-700 dark:text-gray-200">Confirmer mot de passe</label>
          <Password v-model="confirmPassword" :toggleMask="true" :feedback="false" placeholder="Confirmer mot de passe" class="w-full" />

          <div v-if="errors.new_password" class="text-red-600 text-sm">
            <div v-for="(e, i) in errors.new_password" :key="i">{{ e }}</div>
          </div>

          <div class="flex justify-between mt-6">
            <Button label="Retour" icon="pi pi-arrow-left" outlined @click="step=2" />
            <Button label="Changer le mot de passe" icon="pi pi-key" class="p-button-success p-button-rounded" @click="resetPassword" :loading="loading" />
          </div>
        </div>

        <!-- Résumé -->
        <div v-else-if="step === 4" class="space-y-4 text-center">
          <div class="bg-green-50 dark:bg-green-800 p-6 rounded-xl shadow-inner">
            <h3 class="text-xl font-semibold text-green-700 dark:text-green-100 mb-2">✅ Succès</h3>
            <p>Votre mot de passe a été réinitialisé avec succès.</p>
          </div>
          <div class="flex justify-center mt-6">
            <Button label="Revenir à la connexion" icon="pi pi-sign-in" outlined @click="newReset" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>