#include <stdlib.h>
#include "generator.h"
#include "finders.h"
#include "biomenoise.h"
void *rust_alloc_generator(void) { return malloc(sizeof(Generator)); }
void rust_free_generator(void *g) { free(g); }
void rust_free_int_buffer(int *ptr) { free(ptr); }
int rust_is_slime_chunk(uint64_t seed, int chunkX, int chunkZ) {
    return isSlimeChunk(seed, chunkX, chunkZ);
}
void *rust_alloc_surface_noise(void) { return malloc(sizeof(SurfaceNoise)); }
void rust_free_surface_noise(void *sn) { free(sn); }
void rust_init_surface_noise(void *sn, int dim, uint64_t seed) {
    initSurfaceNoise((SurfaceNoise *)sn, dim, seed);
}
