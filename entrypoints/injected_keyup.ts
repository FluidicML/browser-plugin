export default defineUnlistedScript({
  main() {
    console.log(window.fluidic_args.injected_keyup.selector)
    console.log(window.fluidic_args.injected_keyup.value)
  },
})
