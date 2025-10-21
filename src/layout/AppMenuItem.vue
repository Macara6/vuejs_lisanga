<script setup>
import { useLayout } from '@/layout/composables/layout';
import { onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const { layoutState, setActiveMenuItem, toggleMenu } = useLayout();

const props = defineProps({
    item: {
        type: Object,
        default: () => ({})
    },
    index: {
        type: Number,
        default: 0
    },
    root: {
        type: Boolean,
        default: true
    },
    parentItemKey: {
        type: String,
        default: null
    }
});

const isActiveMenu = ref(false);
const itemKey = ref(null);

onBeforeMount(() => {
    itemKey.value = props.parentItemKey ? props.parentItemKey + '-' + props.index : String(props.index);

    const activeItem = layoutState.activeMenuItem;

    isActiveMenu.value = activeItem === itemKey.value || activeItem ? activeItem.startsWith(itemKey.value + '-') : false;
});

watch(
    () => layoutState.activeMenuItem,
    (newVal) => {
        isActiveMenu.value = newVal === itemKey.value || newVal.startsWith(itemKey.value + '-');
    }
);

function itemClick(event, item) {
    if (item.disabled) {
        event.preventDefault();
        return;
    }

    if ((item.to || item.url) && (layoutState.staticMenuMobileActive || layoutState.overlayMenuActive)) {
        toggleMenu();
    }

    if (item.command) {
        item.command({ originalEvent: event, item: item });
    }

    const foundItemKey = item.items ? (isActiveMenu.value ? props.parentItemKey : itemKey) : itemKey.value;

    setActiveMenuItem(foundItemKey);
}

function checkActiveRoute(item) {
    return route.path === item.to;
}
</script>

<template>
    <li :class="{ 'layout-root-menuitem': root, 'active-menuitem': isActiveMenu }">
        <div v-if="root && item.visible !== false" class="layout-menuitem-root-text">{{ item.label }}</div>
        <a v-if="(!item.to || item.items) && item.visible !== false" :href="item.url" @click="itemClick($event, item, index)" :class="item.class" :target="item.target" tabindex="0">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </a>
        <router-link v-if="item.to && !item.items && item.visible !== false" @click="itemClick($event, item, index)" :class="[item.class, { 'active-route': checkActiveRoute(item) }]" tabindex="0" :to="item.to">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </router-link>
        <Transition v-if="item.items && item.visible !== false" name="layout-submenu">
            <ul v-show="root ? true : isActiveMenu" class="layout-submenu">
                <app-menu-item v-for="(child, i) in item.items" :key="child" :index="i" :item="child" :parentItemKey="itemKey" :root="false"></app-menu-item>
            </ul>
        </Transition>
    </li>
</template>

<style lang="scss" scoped>
.layout-menuitem-root-text {
  font-weight: bold;
  padding: 0.5rem 1rem;
}

.layout-menuitem-icon {
  margin-right: 0.5rem;
}

/* Menu principal */
li.layout-root-menuitem {
  list-style: none;
  position: relative;
}

/* Sous-menu */
ul.layout-submenu {
  padding-left: 1rem;
  margin: 0;
}

/* Transition pour sous-menu */
.layout-submenu-enter-active,
.layout-submenu-leave-active {
  transition: max-height 0.3s ease;
}
.layout-submenu-enter,
.layout-submenu-leave-to {
  max-height: 0;
  overflow: hidden;
}

/* Menu responsive */
@media (max-width: 1024px) {
  li.layout-root-menuitem {
    display: block;
    width: 100%;
  }
  
  a, router-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
  }

  .layout-submenu {
    padding-left: 0.5rem;
  }
}

@media (max-width: 768px) {
  .layout-menuitem-text {
    font-size: 0.9rem;
  }
  
  .layout-menuitem-icon {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  a, router-link {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .layout-submenu {
    padding-left: 0.25rem;
  }
}
</style>

