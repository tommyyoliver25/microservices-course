import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, firstValueFrom } from 'rxjs';
import { PRODUCT_SERVICE } from 'src/ config';
import { PaginationDto } from 'src/common';
import { CreateProductDto } from 'src/common/dto/create-product.dto';
import { UpdateProductDto } from 'src/common/dto/update-product.dto';

@Controller('products')
export class ProductsController {
  
  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productsClient: ClientProxy
  ) {}

  @Post()
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsClient.send({ cmd: 'create_product' }, createProductDto);
  }

  @Get()
  findAllProducts(@Query() paginationDto: PaginationDto) {
    return this.productsClient.send({ cmd: 'find_all_products' }, paginationDto);
  }

  @Get(':id')
  async findOneProduct(@Param('id') id:string) {
    try {
      const product = await firstValueFrom(
        this.productsClient.send({ cmd: 'find_one_product' }, { id })
      )

      return product;
    } catch(error) {
      throw new RpcException(error);
    }

  }

  @Delete(':id')
  deleteProduct(@Param('id') id:string) {
    return this.productsClient.send({ cmd: 'delete_product' }, { id })
      .pipe( catchError((err) => { throw new RpcException(err) }) );
  }

  @Patch(':id')
  updateProduct(@Param('id', ParseIntPipe) id:string, @Body() body:UpdateProductDto) {
    return this.productsClient.send({ cmd: 'update_product' }, {id, ...body})
      .pipe( catchError((err) => { throw new RpcException(err) }) );
  }

}
