import { Body, Controller, Get, Inject, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ORDER_SERVICE } from 'src/ config';
import { OrderPaginationDto } from './dto';
import { firstValueFrom } from 'rxjs';
import { StatusDto } from './dto/status.dto';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  
  constructor(
    @Inject(ORDER_SERVICE) private readonly orderClient: ClientProxy
  ) {}

  @Post()
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderClient.send('createOrder', createOrderDto);
  }

  @Get()
  findAll( @Query() paginationDto: OrderPaginationDto ) {
    return this.orderClient.send('findAllOrders', paginationDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const order = await firstValueFrom(
        this.orderClient.send('findOneOrder', { id })
      )
      return order;
    } catch( err ) {
      throw new RpcException(err);
    }
  }

  @Patch(':id')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() statusDto: StatusDto
  ) {
    try {
      return this.orderClient.send('changeOrderStatus', { id, ...statusDto })
    } catch( err ) {
      throw new RpcException(err);
    }
  }
  
}
