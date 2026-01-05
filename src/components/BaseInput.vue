<template>
  <label class="field">
    <span>{{ label }}</span>
    <input
      :type="type"
      :name="name"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </label>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  type: { type: String, default: "text" },
  name: { type: String, default: "" },
  placeholder: { type: String, default: "" },
  modelValue: { type: String, default: "" },
});

defineEmits(["update:modelValue"]);
</script>
